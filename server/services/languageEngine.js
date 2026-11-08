/**
 * @file services/languageEngine.js
 * @description Standalone multi-lingual ingestion engine.
 *   Fetches free learning materials in multiple target languages.
 *   Guarantees zero database disruption via $setOnInsert upsert patterns.
 */

import https from "https";
import Resource from "../models/Resource.js";
import { detectLanguage } from "../utils/languageDetector.js";
import { classifyDifficulty } from "./automationEngine.js";
import { fetchYouTubePublic } from "./sources/youtubePublicSource.js";

// ── Localized Multi-Language Query Sets ──────────────────────────────────────
const LOCALIZED_QUERIES = [
  // Hindi (Devanagari & Romanized)
  { q: "कंप्यूटर प्रोग्रामिंग सीखे", lang: "Hindi", domain: "Programming" },
  { q: "पायथन ट्यूटोरियल हिंदी में", lang: "Hindi", domain: "Programming" },
  { q: "मानव शरीर रचना विज्ञान", lang: "Hindi", domain: "Healthcare" },
  { q: "गणित बेसिक सीखे", lang: "Hindi", domain: "Mathematics" },
  { q: "web development full course in hindi", lang: "Hindi", domain: "Programming" },

  // Spanish
  { q: "curso de programación para principiantes", lang: "Spanish", domain: "Programming" },
  { q: "anatomía humana para estudiantes", lang: "Spanish", domain: "Healthcare" },
  { q: "cálculo diferencial desde cero", lang: "Spanish", domain: "Mathematics" },
  { q: "inteligencia artificial conceptos básicos", lang: "Spanish", domain: "AI" },

  // French
  { q: "apprendre la programmation débutant", lang: "French", domain: "Programming" },
  { q: "cours anatomie humaine complet", lang: "French", domain: "Healthcare" },
  { q: "mathématiques fondamentales cours", lang: "French", domain: "Mathematics" },

  // German
  { q: "programmieren lernen für anfänger", lang: "German", domain: "Programming" },
  { q: "menschliche anatomie grundlagen", lang: "German", domain: "Healthcare" },
  { q: "mathematik grundlagen online kurs", lang: "German", domain: "Mathematics" },

  // Tamil
  { q: "கம்ப்யூட்டர் புரோகிராமிங் தமிழ்", lang: "Tamil", domain: "Programming" },
  { q: "பைதான் தமிழ் டுடோரியல்", lang: "Tamil", domain: "Programming" },
];

function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("Timeout")));
  });
}

/**
 * Runs localized YouTube ingestion for target languages.
 * @param {object} [opts]
 * @param {number} [opts.maxPerQuery=3]
 * @returns {Promise<{saved: number, skipped: number, errors: number}>}
 */
export async function ingestMultiLingualYouTube({ maxPerQuery = 3 } = {}) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let saved = 0, skipped = 0, errors = 0;

  for (const { q, lang, domain } of LOCALIZED_QUERIES) {
    try {
      let videos = [];

      // 1. Try official API if key exists
      if (apiKey) {
        try {
          const url =
            `https://www.googleapis.com/youtube/v3/search` +
            `?part=snippet&type=video&videoDuration=medium&videoEmbeddable=true` +
            `&maxResults=${maxPerQuery}&q=${encodeURIComponent(q)}&key=${apiKey}`;

          const data = await fetchJSON(url);
          if (data && !data.error && Array.isArray(data.items)) {
            videos = data.items.map((item) => ({
              videoId: item.id?.videoId,
              title: item.snippet?.title || "Untitled",
              description: item.snippet?.description || "",
              thumbnail: item.snippet?.thumbnails?.high?.url || "",
            }));
          }
        } catch {
          // Fall through
        }
      }

      // 2. Fallback to public parser if official API fails or is unconfigured
      if (videos.length === 0) {
        const publicItems = await fetchYouTubePublic(q, maxPerQuery);
        if (publicItems && publicItems.length > 0) {
          videos = publicItems;
        }
      }

      for (const item of videos) {
        const videoId = item.videoId;
        if (!videoId) { skipped++; continue; }

        const title = item.title || "Untitled";
        const description = item.description || "";
        const resourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const detectedLang = detectLanguage(`${title} ${description}`) || lang;
        const level = classifyDifficulty(`${title} ${description}`);

        const payload = {
          title,
          description: description.slice(0, 500) || `${domain} educational video (${detectedLang})`,
          url: resourceUrl,
          platform: "YouTube",
          category: domain,
          level,
          language: detectedLang,
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          tags: [domain.toLowerCase(), detectedLang.toLowerCase(), "multilingual"],
          rating: 4.0,
          verified: false,
          featured: false,
          status: "approved",
          submitterName: "LanguageBot",
          reviewNotes: `Auto-ingested via LanguageEngine. Query: "${q}". Language: ${detectedLang}.`,
        };

        // Strict non-destructive upsert
        const result = await Resource.updateOne(
          { url: resourceUrl },
          { $setOnInsert: payload },
          { upsert: true }
        );

        if (result.upsertedCount > 0) saved++;
        else skipped++;
      }

      await new Promise((r) => setTimeout(r, 400));
    } catch (_err) {
      errors++;
    }
  }

  return { saved, skipped, errors };
}

