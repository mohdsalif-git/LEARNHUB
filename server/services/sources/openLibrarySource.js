/**
 * @file services/sources/openLibrarySource.js
 * @description Free-resource ingestion from Open Library (openlibrary.org).
 *   - Uses the Open Library Search API — completely FREE, no API key required.
 *   - Fetches openly licensed books on ALL learning domains.
 *   - Each book links directly to its Open Library read/borrow page.
 *   - Fully isolated: only emits on automation:activity and automation:new_resource.
 *   - Only inserts new records via $setOnInsert upsert — zero schema disruption.
 */

import https from "https";
import Resource from "../../models/Resource.js";
import { classifyDifficulty } from "../automationEngine.js";
import { resolveCategory } from "../automationEngine.js";
import { scoreResource } from "../qualityScorer.js";

// ── Open Library Search Queries — All Learning Domains ────────────────────────
const OL_QUERIES = [
  // Science & Math
  "calculus mathematics textbook",
  "linear algebra free textbook",
  "statistics probability textbook",
  "quantum physics introduction",
  "biology cell molecular",
  "organic chemistry textbook",
  "astronomy astrophysics",
  "genetics genomics",
  // Healthcare & Medicine
  "anatomy physiology medical",
  "public health epidemiology",
  "nutrition dietetics food science",
  "pharmacology clinical",
  "mental health psychology",
  // Technology & Engineering
  "computer science programming",
  "data structures algorithms",
  "electrical engineering",
  "mechanical engineering",
  "civil engineering",
  // AI & Data
  "machine learning artificial intelligence",
  "data science statistics",
  // Humanities
  "world history civilizations",
  "philosophy ethics",
  "linguistics language learning",
  "economics finance",
  "political science",
  "sociology psychology",
  // Arts & Creative
  "music theory composition",
  "art history",
  "photography film",
  // Environment
  "climate change environment",
  "renewable energy sustainability",
  // Business
  "entrepreneurship business management",
  "accounting finance",
  // Cooking & Fitness
  "nutrition healthy eating",
  "fitness exercise physiology",
];

const OL_API_BASE = "https://openlibrary.org/search.json";
const COVER_BASE  = "https://covers.openlibrary.org/b/id";
const READ_BASE   = "https://openlibrary.org";

// ── Minimal HTTPS GET ────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "LearnHub-AutoBot/1.0" } }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(raw)); }
          catch (e) { reject(new Error(`JSON parse: ${e.message}`)); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("Timeout")));
  });
}

// ── Emitter (injected from engine) ───────────────────────────────────────────
let _emit = () => {};
export function setEmitter(fn) { _emit = fn; }

// ── Main Ingestion Function ───────────────────────────────────────────────────
/**
 * Ingests free books from Open Library.
 * @param {object} opts
 * @param {number} [opts.maxPerQuery=4]   Books per query.
 * @param {number} [opts.minScore=2.0]    Minimum quality score (0–5) to save.
 * @returns {Promise<{saved:number, skipped:number, errors:number}>}
 */
export async function ingestOpenLibrary({ maxPerQuery = 4, minScore = 2.0 } = {}) {
  let saved = 0, skipped = 0, errors = 0;

  _emit("automation:activity", {
    type: "info", source: "OpenLibrary",
    message: `Starting Open Library ingestion — ${OL_QUERIES.length} queries × ${maxPerQuery} books.`,
  });

  for (const query of OL_QUERIES) {
    try {
      const fields = "key,title,author_name,first_publish_year,subject,cover_i,number_of_pages_median";
      const url = `${OL_API_BASE}?q=${encodeURIComponent(query)}&fields=${fields}&limit=${maxPerQuery}&language=eng`;
      const data = await fetchJSON(url);
      const docs = data.docs || [];

      for (const doc of docs) {
        try {
          if (!doc.key || !doc.title) { skipped++; continue; }

          const resourceUrl = `${READ_BASE}${doc.key}`;
          const title       = doc.title;
          const authors     = (doc.author_name || ["Unknown Author"]).slice(0, 3).join(", ");
          const subjects    = (doc.subject || []).slice(0, 6);
          const description = subjects.length
            ? `Free book by ${authors}. Subjects: ${subjects.slice(0, 4).join(", ")}.`
            : `Free educational book by ${authors} on Open Library.`;
          const thumbnail   = doc.cover_i
            ? `${COVER_BASE}/${doc.cover_i}-M.jpg`
            : "";
          const level       = classifyDifficulty(`${title} ${description}`);
          const tags        = subjects.map((s) => s.toLowerCase().slice(0, 30)).slice(0, 8);
          const { categoryName, categoryId } = await resolveCategory(subjects[0] || title);

          const rawScore = scoreResource({ title, description, thumbnail, tags, platform: "Other" });
          if (rawScore < minScore) { skipped++; continue; }

          const payload = {
            title: `📖 ${title}`.slice(0, 300),
            description: description.slice(0, 500),
            url: resourceUrl,
            platform: "Other",
            category: categoryName,
            categoryId,
            level,
            thumbnail,
            tags,
            rating: parseFloat(rawScore.toFixed(1)),
            verified: false,
            featured: false,
            status: "approved",
            submitterName: "AutoBot",
            reviewNotes: `Auto-ingested from Open Library. Query: "${query}". Published: ${doc.first_publish_year || "N/A"}.`,
          };

          const result = await Resource.updateOne(
            { url: resourceUrl },
            { $setOnInsert: payload },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            saved++;
            _emit("automation:new_resource", {
              source: "OpenLibrary", title, url: resourceUrl, level, category: categoryName,
            });
          } else {
            skipped++;
          }
        } catch (itemErr) {
          errors++;
          _emit("automation:activity", {
            type: "error", source: "OpenLibrary",
            message: `Item error: ${itemErr.message}`,
          });
        }
      }

      _emit("automation:activity", {
        type: "progress", source: "OpenLibrary",
        message: `Query "${query}" done — ${docs.length} books processed.`,
      });

      // Courtesy delay — OL is a non-profit, be gentle
      await new Promise((r) => setTimeout(r, 500));
    } catch (queryErr) {
      errors++;
      _emit("automation:activity", {
        type: "error", source: "OpenLibrary",
        message: `Query "${query}" failed: ${queryErr.message}`,
      });
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  _emit("automation:activity", {
    type: "complete", source: "OpenLibrary",
    message: `Open Library ingestion done — saved: ${saved}, skipped: ${skipped}, errors: ${errors}.`,
    stats: { saved, skipped, errors },
  });

  return { saved, skipped, errors };
}
