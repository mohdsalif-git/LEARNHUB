/**
 * @file services/sources/freeCodeCampSource.js
 * @description Free-resource ingestion from freeCodeCamp's public news/blog API.
 *   - Uses freeCodeCamp's Ghost CMS public API — completely FREE, no API key.
 *   - Fetches tutorials, guides, and in-depth articles across all subjects.
 *   - Only inserts new records via $setOnInsert — zero schema disruption.
 *   - Emits on automation:activity and automation:new_resource only.
 */

import https from "https";
import Resource from "../../models/Resource.js";
import { classifyDifficulty } from "../automationEngine.js";
import { resolveCategory } from "../automationEngine.js";
import { scoreResource } from "../qualityScorer.js";

// ── freeCodeCamp News API (Ghost CMS, public) ─────────────────────────────────
// Tags to fetch — covers technology, science, math, career, and more
const FCC_TAGS = [
  "javascript", "python", "machine-learning", "data-science",
  "web-development", "react", "node-js", "algorithms",
  "linux", "git", "sql", "typescript",
  "career", "mathematics", "science", "ai",
  "cybersecurity", "cloud-computing", "devops",
  "ios", "android", "flutter",
  "computer-science", "open-source",
];

const FCC_API = "https://www.freecodecamp.org/news/ghost/api/v3/content/posts";
const FCC_KEY = "9cc5ad3c504aa37265020cf39d"; // Public read-only Ghost content key
const POSTS_PER_TAG = 5;

// ── Minimal HTTPS GET ────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { "User-Agent": "LearnHub-AutoBot/1.0" },
    }, (res) => {
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
    req.setTimeout(12000, () => req.destroy(new Error("Timeout")));
  });
}

// ── Emitter ───────────────────────────────────────────────────────────────────
let _emit = () => {};
export function setEmitter(fn) { _emit = fn; }

// ── Main Ingestion Function ───────────────────────────────────────────────────
/**
 * Ingests articles from freeCodeCamp News.
 * @param {object} opts
 * @param {number} [opts.minScore=2.0]  Minimum quality score to save.
 * @returns {Promise<{saved:number, skipped:number, errors:number}>}
 */
export async function ingestFreeCodeCamp({ minScore = 2.0 } = {}) {
  let saved = 0, skipped = 0, errors = 0;

  _emit("automation:activity", {
    type: "info", source: "freeCodeCamp",
    message: `Starting freeCodeCamp ingestion — ${FCC_TAGS.length} tags × ${POSTS_PER_TAG} posts.`,
  });

  for (const tag of FCC_TAGS) {
    try {
      const fields = "id,title,slug,custom_excerpt,feature_image,tags,published_at,url";
      const url =
        `${FCC_API}?key=${FCC_KEY}` +
        `&filter=tag:${encodeURIComponent(tag)}` +
        `&fields=${fields}` +
        `&limit=${POSTS_PER_TAG}` +
        `&order=published_at+desc`;

      const data = await fetchJSON(url);
      const posts = data.posts || [];

      for (const post of posts) {
        try {
          if (!post.url || !post.title) { skipped++; continue; }

          const resourceUrl = post.url;
          const title       = post.title;
          const description = post.custom_excerpt || `In-depth tutorial from freeCodeCamp: ${title}`;
          const thumbnail   = post.feature_image || "";
          const level       = classifyDifficulty(`${title} ${description}`);
          const rawTags     = (post.tags || []).map((t) => t.slug || t.name || "").filter(Boolean).slice(0, 8);
          const tags        = rawTags.length ? rawTags : [tag];
          const { categoryName, categoryId } = await resolveCategory(tag);

          const rawScore = scoreResource({
            title, description, thumbnail, tags,
            platform: "freeCodeCamp", url: resourceUrl,
          });
          if (rawScore < minScore) { skipped++; continue; }

          const payload = {
            title: title.slice(0, 300),
            description: description.slice(0, 500),
            url: resourceUrl,
            platform: "freeCodeCamp",
            category: categoryName,
            categoryId,
            level,
            thumbnail,
            tags,
            rating: parseFloat(rawScore.toFixed(1)),
            verified: true,   // freeCodeCamp is a trusted source
            featured: false,
            status: "approved",
            submitterName: "AutoBot",
            reviewNotes: `Auto-ingested from freeCodeCamp News. Tag: "${tag}". Published: ${post.published_at || "N/A"}.`,
          };

          const result = await Resource.updateOne(
            { url: resourceUrl },
            { $setOnInsert: payload },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            saved++;
            _emit("automation:new_resource", {
              source: "freeCodeCamp", title, url: resourceUrl, level, category: categoryName,
            });
          } else {
            skipped++;
          }
        } catch (itemErr) {
          errors++;
          _emit("automation:activity", {
            type: "error", source: "freeCodeCamp",
            message: `Post error: ${itemErr.message}`,
          });
        }
      }

      _emit("automation:activity", {
        type: "progress", source: "freeCodeCamp",
        message: `Tag "${tag}" done — ${posts.length} posts processed.`,
      });

      await new Promise((r) => setTimeout(r, 300));
    } catch (tagErr) {
      errors++;
      _emit("automation:activity", {
        type: "error", source: "freeCodeCamp",
        message: `Tag "${tag}" failed: ${tagErr.message}`,
      });
    }
  }

  _emit("automation:activity", {
    type: "complete", source: "freeCodeCamp",
    message: `freeCodeCamp ingestion done — saved: ${saved}, skipped: ${skipped}, errors: ${errors}.`,
    stats: { saved, skipped, errors },
  });

  return { saved, skipped, errors };
}
