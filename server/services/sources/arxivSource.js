/**
 * @file services/sources/arxivSource.js
 * @description Free-resource ingestion from arXiv (arxiv.org).
 *   - Uses the arXiv API (Atom/XML feed) — completely FREE, no API key.
 *   - Fetches landmark educational/survey papers across Science, Math, CS, AI,
 *     Economics, Biology, Physics, and more.
 *   - Only inserts new records via $setOnInsert — zero schema disruption.
 *   - Parses Atom XML using lightweight string extraction (no external deps).
 *   - Emits on automation:activity and automation:new_resource only.
 */

import https from "https";
import Resource from "../../models/Resource.js";
import { classifyDifficulty } from "../automationEngine.js";
import { resolveCategory } from "../automationEngine.js";
import { scoreResource } from "../qualityScorer.js";

// ── arXiv Search Queries — Educational Survey Papers ──────────────────────────
// Targets "survey", "introduction", "tutorial", and "review" papers that serve
// as free, authoritative learning resources for advanced learners.
const ARXIV_QUERIES = [
  // AI & Machine Learning
  { q: "ti:introduction+to+machine+learning+survey", cat: "cs.LG", label: "Machine Learning" },
  { q: "ti:deep+learning+survey+review", cat: "cs.LG", label: "Deep Learning" },
  { q: "ti:natural+language+processing+survey", cat: "cs.CL", label: "NLP" },
  { q: "ti:computer+vision+survey+tutorial", cat: "cs.CV", label: "Computer Vision" },
  { q: "ti:reinforcement+learning+survey", cat: "cs.AI", label: "Reinforcement Learning" },
  { q: "ti:large+language+models+survey", cat: "cs.CL", label: "Large Language Models" },
  { q: "ti:transformer+attention+survey", cat: "cs.LG", label: "Transformers" },
  // Mathematics
  { q: "ti:introduction+linear+algebra+tutorial", cat: "math.LA", label: "Linear Algebra" },
  { q: "ti:introduction+probability+statistics+tutorial", cat: "math.ST", label: "Statistics" },
  { q: "ti:graph+theory+survey+introduction", cat: "math.CO", label: "Graph Theory" },
  { q: "ti:numerical+methods+tutorial+introduction", cat: "math.NA", label: "Numerical Methods" },
  // Physics
  { q: "ti:quantum+computing+introduction+tutorial", cat: "quant-ph", label: "Quantum Computing" },
  { q: "ti:introduction+quantum+mechanics+tutorial", cat: "quant-ph", label: "Quantum Mechanics" },
  { q: "ti:thermodynamics+statistical+mechanics+introduction", cat: "cond-mat", label: "Thermodynamics" },
  // Computer Science
  { q: "ti:algorithms+complexity+survey+introduction", cat: "cs.DS", label: "Algorithms" },
  { q: "ti:cryptography+introduction+survey", cat: "cs.CR", label: "Cryptography" },
  { q: "ti:distributed+systems+survey+introduction", cat: "cs.DC", label: "Distributed Systems" },
  { q: "ti:operating+systems+survey+tutorial", cat: "cs.OS", label: "Operating Systems" },
  // Biology & Medicine
  { q: "ti:genomics+bioinformatics+survey+introduction", cat: "q-bio.GN", label: "Genomics" },
  { q: "ti:neuroscience+computational+introduction+survey", cat: "q-bio.NC", label: "Neuroscience" },
  { q: "ti:epidemiology+introduction+tutorial", cat: "q-bio.PE", label: "Epidemiology" },
  // Economics & Finance
  { q: "ti:introduction+economics+survey+tutorial", cat: "econ.GN", label: "Economics" },
  { q: "ti:financial+mathematics+introduction+survey", cat: "q-fin.MF", label: "Financial Math" },
  // Environment & Engineering
  { q: "ti:renewable+energy+solar+wind+survey+review", cat: "eess.SY", label: "Renewable Energy" },
  { q: "ti:robotics+introduction+survey", cat: "cs.RO", label: "Robotics" },
];

const ARXIV_API = "https://export.arxiv.org/api/query";
const MAX_RESULTS = 3; // arXiv search API — 3 papers per query

// ── Atom XML Parser (zero dependencies) ─────────────────────────────────────
function extractAll(xml, tag) {
  const results = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  let m;
  while ((m = re.exec(xml)) !== null) {
    results.push(m[1].trim().replace(/\s+/g, " "));
  }
  return results;
}

function extractOne(xml, tag) {
  return extractAll(xml, tag)[0] || "";
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "g");
  const m = re.exec(xml);
  return m ? m[1] : "";
}

function parseArxivEntries(xml) {
  const entries = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRe.exec(xml)) !== null) {
    const entry = m[1];
    const id    = extractOne(entry, "id").replace("http://", "https://");
    const title = extractOne(entry, "title");
    const summary = extractOne(entry, "summary");
    const published = extractOne(entry, "published").slice(0, 10);
    const authors = extractAll(entry, "name").slice(0, 3).join(", ");
    // Extract PDF link
    const pdfHref = (() => {
      const linkRe = /<link[^>]*title="pdf"[^>]*href="([^"]*)"[^>]*\/>/;
      const lm = linkRe.exec(entry);
      return lm ? lm[1].replace("http://", "https://") : id.replace("/abs/", "/pdf/");
    })();
    // Extract categories
    const catRe = /<category[^>]*term="([^"]*)"[^>]*\/>/g;
    const cats = [];
    let cm;
    while ((cm = catRe.exec(entry)) !== null) cats.push(cm[1]);

    if (id && title && summary) {
      entries.push({ id, title, summary, published, authors, pdfHref, categories: cats });
    }
  }
  return entries;
}

// ── Minimal HTTPS GET returning raw string ────────────────────────────────────
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { "User-Agent": "LearnHub-AutoBot/1.0" },
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (res.statusCode === 200) resolve(raw);
        else reject(new Error(`HTTP ${res.statusCode}`));
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("Timeout")));
  });
}

// ── Emitter ───────────────────────────────────────────────────────────────────
let _emit = () => {};
export function setEmitter(fn) { _emit = fn; }

// ── Main Ingestion Function ───────────────────────────────────────────────────
/**
 * Ingests arXiv educational survey/introductory papers.
 * @param {object} opts
 * @param {number} [opts.minScore=1.5]  Minimum quality score to save.
 * @returns {Promise<{saved:number, skipped:number, errors:number}>}
 */
export async function ingestArxiv({ minScore = 1.5 } = {}) {
  let saved = 0, skipped = 0, errors = 0;

  _emit("automation:activity", {
    type: "info", source: "arXiv",
    message: `Starting arXiv ingestion — ${ARXIV_QUERIES.length} academic queries.`,
  });

  for (const { q, cat, label } of ARXIV_QUERIES) {
    try {
      const url =
        `${ARXIV_API}?search_query=cat:${encodeURIComponent(cat)}+AND+${q}` +
        `&sortBy=relevance&sortOrder=descending&max_results=${MAX_RESULTS}`;

      const xml = await fetchText(url);
      const entries = parseArxivEntries(xml);

      for (const entry of entries) {
        try {
          const resourceUrl = entry.id;  // canonical abstract page
          const title       = entry.title;
          const description = `${entry.summary.slice(0, 450)} — Authors: ${entry.authors}. Published: ${entry.published}.`;
          const level       = classifyDifficulty(`${title} ${entry.summary}`);
          const tags        = [
            label.toLowerCase(),
            ...entry.categories.slice(0, 3),
            ...title.toLowerCase().split(" ").filter((w) => w.length > 4).slice(0, 3),
          ].slice(0, 8);
          const { categoryName, categoryId } = await resolveCategory(label);

          const rawScore = scoreResource({ title, description, thumbnail: "", tags, platform: "Other" });
          if (rawScore < minScore) { skipped++; continue; }

          const payload = {
            title: `🔬 ${title}`.slice(0, 300),
            description: description.slice(0, 500),
            url: resourceUrl,
            platform: "Other",
            category: categoryName,
            categoryId,
            level,
            thumbnail: "",
            tags,
            rating: parseFloat(rawScore.toFixed(1)),
            verified: false,
            featured: false,
            status: "approved",
            submitterName: "AutoBot",
            reviewNotes: `Auto-ingested from arXiv. Category: ${cat}. Label: "${label}". Published: ${entry.published}.`,
          };

          const result = await Resource.updateOne(
            { url: resourceUrl },
            { $setOnInsert: payload },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            saved++;
            _emit("automation:new_resource", {
              source: "arXiv", title, url: resourceUrl, level, category: categoryName,
            });
          } else {
            skipped++;
          }
        } catch (itemErr) {
          errors++;
          _emit("automation:activity", {
            type: "error", source: "arXiv",
            message: `Entry error: ${itemErr.message}`,
          });
        }
      }

      _emit("automation:activity", {
        type: "progress", source: "arXiv",
        message: `Query "${label}" done — ${entries.length} papers processed.`,
      });

      // arXiv rate limit: max 3 req/sec — we do 1 req/sec to be safe
      await new Promise((r) => setTimeout(r, 1000));
    } catch (queryErr) {
      errors++;
      _emit("automation:activity", {
        type: "error", source: "arXiv",
        message: `Query "${label}" failed: ${queryErr.message}`,
      });
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  _emit("automation:activity", {
    type: "complete", source: "arXiv",
    message: `arXiv ingestion done — saved: ${saved}, skipped: ${skipped}, errors: ${errors}.`,
    stats: { saved, skipped, errors },
  });

  return { saved, skipped, errors };
}
