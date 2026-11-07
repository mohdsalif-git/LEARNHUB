/**
 * @file services/sources/wikiSource.js
 * @description Free-resource ingestion from Wikipedia (en.wikipedia.org).
 *   - Uses the Wikipedia REST API & OpenSearch — completely FREE, no API key.
 *   - Fetches high-quality educational article summaries on ALL learning domains.
 *   - Direct links to full Wikipedia articles for learners.
 *   - Only inserts new records via $setOnInsert — zero schema disruption.
 *   - Emits only on automation:activity and automation:new_resource channels.
 */

import https from "https";
import Resource from "../../models/Resource.js";
import { classifyDifficulty } from "../automationEngine.js";
import { resolveCategory } from "../automationEngine.js";
import { scoreResource } from "../qualityScorer.js";

// ── Wikipedia Educational Topics — All Learning Domains ───────────────────────
// These are searched as Wikipedia article titles / concepts.
const WIKI_TOPICS = [
  // Mathematics
  "Calculus", "Linear algebra", "Statistics", "Number theory",
  "Differential equations", "Probability theory", "Discrete mathematics",
  // Science
  "Quantum mechanics", "Classical mechanics", "Thermodynamics",
  "Electromagnetism", "Genetics", "Cell biology", "Ecology",
  "Organic chemistry", "Biochemistry", "Neuroscience", "Astrophysics",
  "Evolution", "Microbiology", "Immunology",
  // Technology
  "Computer science", "Algorithms", "Data structures",
  "Operating systems", "Computer networking", "Database",
  "Software engineering", "Cryptography",
  // AI & Data Science
  "Machine learning", "Deep learning", "Natural language processing",
  "Computer vision", "Reinforcement learning", "Data science",
  // Healthcare
  "Human anatomy", "Human physiology", "Pharmacology",
  "Epidemiology", "Public health", "Nutrition", "Mental health",
  "Immunology", "Cardiology", "Oncology",
  // Engineering
  "Electrical engineering", "Mechanical engineering",
  "Civil engineering", "Chemical engineering", "Aerospace engineering",
  // Environment
  "Climate change", "Renewable energy", "Ecology", "Conservation biology",
  "Sustainability",
  // Social Sciences
  "Psychology", "Sociology", "Economics", "Political science",
  "Cognitive science", "Behavioral economics",
  // Arts & Humanities
  "Music theory", "Art history", "Film theory", "Philosophy",
  "Ethics", "Logic", "Epistemology", "Linguistics",
  // History
  "History of science", "Ancient history", "World War II",
  "Industrial Revolution", "History of mathematics",
  // Business & Finance
  "Financial economics", "Accounting", "Marketing", "Entrepreneurship",
  "Behavioral finance", "Corporate finance",
];

const WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKI_SEARCH = "https://en.wikipedia.org/w/api.php";

// ── Minimal HTTPS GET ────────────────────────────────────────────────────────
function fetchJSON(url, params = {}) {
  return new Promise((resolve, reject) => {
    const finalUrl = Object.keys(params).length
      ? `${url}?${new URLSearchParams(params).toString()}`
      : url;
    const req = https.get(finalUrl, {
      headers: {
        "User-Agent": "LearnHub-AutoBot/1.0 (educational; contact: admin@learnhub.dev)",
        Accept: "application/json",
      },
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(raw)); }
          catch (e) { reject(new Error(`JSON parse: ${e.message}`)); }
        } else if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect manually for summaries
          resolve({ redirected: true });
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(12000, () => req.destroy(new Error("Timeout")));
  });
}

// ── Emitter ───────────────────────────────────────────────────────────────────
let _emit = () => {};
export function setEmitter(fn) { _emit = fn; }

// ── Main Ingestion Function ───────────────────────────────────────────────────
/**
 * Ingests Wikipedia educational article summaries as learning resources.
 * @param {object} opts
 * @param {number} [opts.minScore=2.5]  Minimum quality score to save.
 * @returns {Promise<{saved:number, skipped:number, errors:number}>}
 */
export async function ingestWikipedia({ minScore = 2.5 } = {}) {
  let saved = 0, skipped = 0, errors = 0;

  _emit("automation:activity", {
    type: "info", source: "Wikipedia",
    message: `Starting Wikipedia ingestion — ${WIKI_TOPICS.length} educational topics.`,
  });

  for (const topic of WIKI_TOPICS) {
    try {
      // Fetch the summary for this article title
      const encodedTitle = encodeURIComponent(topic.replace(/ /g, "_"));
      const data = await fetchJSON(`${WIKI_API}/${encodedTitle}`);

      if (!data || data.type === "disambiguation" || !data.extract || data.extract.length < 100) {
        skipped++;
        await new Promise((r) => setTimeout(r, 150));
        continue;
      }

      const title       = data.title || topic;
      const description = (data.extract || "").slice(0, 500);
      const resourceUrl = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodedTitle}`;
      const thumbnail   = data.thumbnail?.source || data.originalimage?.source || "";
      const level       = classifyDifficulty(`${title} ${description}`);
      const tags        = [
        topic.toLowerCase(),
        ...title.toLowerCase().split(" ").filter((w) => w.length > 3).slice(0, 5),
      ].slice(0, 8);
      const { categoryName, categoryId } = await resolveCategory(topic);

      const rawScore = scoreResource({ title, description, thumbnail, tags, platform: "Other" });
      if (rawScore < minScore) { skipped++; continue; }

      const payload = {
        title: `📘 ${title} — Wikipedia`.slice(0, 300),
        description: description,
        url: resourceUrl,
        platform: "Other",
        category: categoryName,
        categoryId,
        level,
        thumbnail,
        tags,
        rating: parseFloat(rawScore.toFixed(1)),
        verified: true,          // Wikipedia is a trusted source
        featured: false,
        status: "approved",
        submitterName: "AutoBot",
        reviewNotes: `Auto-ingested from Wikipedia. Topic: "${topic}".`,
      };

      const result = await Resource.updateOne(
        { url: resourceUrl },
        { $setOnInsert: payload },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        saved++;
        _emit("automation:new_resource", {
          source: "Wikipedia", title, url: resourceUrl, level, category: categoryName,
        });
      } else {
        skipped++;
      }

      // 200 ms between requests — respect Wikipedia rate limits
      await new Promise((r) => setTimeout(r, 200));
    } catch (topicErr) {
      errors++;
      _emit("automation:activity", {
        type: "error", source: "Wikipedia",
        message: `Topic "${topic}" failed: ${topicErr.message}`,
      });
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  _emit("automation:activity", {
    type: "complete", source: "Wikipedia",
    message: `Wikipedia ingestion done — saved: ${saved}, skipped: ${skipped}, errors: ${errors}.`,
    stats: { saved, skipped, errors },
  });

  return { saved, skipped, errors };
}
