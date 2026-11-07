/**
 * @file routes/localizationRoutes.js
 * @description Standalone localization routes for filtering and querying resources by language.
 *   Mounts cleanly under /api/localization without altering established /api/resources endpoints.
 *
 * Endpoints:
 *   GET /api/localization/resources  — Multi-filter query (language, topic, difficulty, platform, search)
 *   GET /api/localization/languages  — Supported languages list with live database document counts
 *   POST /api/localization/ingest    — Trigger localized ingestion (protected)
 */

import express from "express";
import Resource from "../models/Resource.js";
import { SUPPORTED_LANGUAGES } from "../utils/languageDetector.js";
import { ingestMultiLingualYouTube } from "../services/languageEngine.js";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── GET /api/localization/resources ──────────────────────────────────────────
router.get("/localization/resources", async (req, res, next) => {
  try {
    const {
      language,
      lang,
      topic,
      category,
      difficulty,
      level,
      platform,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { status: "approved" };
    const andClauses = [];

    // 1. Language Filter
    const targetLang = language || lang;
    if (targetLang && typeof targetLang === "string" && targetLang.trim() && targetLang.toLowerCase() !== "all") {
      const cleanLang = escapeRegex(targetLang.trim());
      andClauses.push({
        $or: [
          { tags: new RegExp(`^${cleanLang}$`, "i") },
          { reviewNotes: new RegExp(`Language:\\s*${cleanLang}`, "i") },
        ],
      });
    }

    // 2. Topic / Category Filter
    const targetTopic = topic || category;
    if (targetTopic && typeof targetTopic === "string" && targetTopic.trim() && targetTopic.toLowerCase() !== "all") {
      andClauses.push({
        $or: [
          { category: new RegExp(`^${escapeRegex(targetTopic.trim())}$`, "i") },
          { tags: new RegExp(`^${escapeRegex(targetTopic.trim())}$`, "i") },
        ],
      });
    }

    // 3. Difficulty Level Filter
    const targetDifficulty = difficulty || level;
    if (targetDifficulty && ["Beginner", "Intermediate", "Advanced"].includes(targetDifficulty)) {
      query.level = targetDifficulty;
    }

    // 4. Platform Filter
    if (platform && typeof platform === "string" && platform.trim() && platform.toLowerCase() !== "all") {
      query.platform = new RegExp(`^${escapeRegex(platform.trim())}$`, "i");
    }

    // 5. Keyword Search
    if (search && typeof search === "string" && search.trim()) {
      const cleanSearch = escapeRegex(search.trim());
      andClauses.push({
        $or: [
          { title: { $regex: cleanSearch, $options: "i" } },
          { description: { $regex: cleanSearch, $options: "i" } },
          { tags: { $regex: cleanSearch, $options: "i" } },
        ],
      });
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .sort({ rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Resource.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        resources,
        pagination: {
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
          limit: limitNum,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/localization/languages ──────────────────────────────────────────
router.get("/localization/languages", async (_req, res, next) => {
  try {
    const counts = await Promise.all(
      SUPPORTED_LANGUAGES.map(async (language) => {
        const count = await Resource.countDocuments({
          status: "approved",
          $or: [
            { tags: new RegExp(`^${language}$`, "i") },
            { reviewNotes: new RegExp(`Language:\\s*${language}`, "i") },
          ],
        });
        return { language, count };
      })
    );

    res.json({
      success: true,
      data: {
        supported: SUPPORTED_LANGUAGES,
        counts,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/localization/ingest ────────────────────────────────────────────
router.post(
  "/localization/ingest",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    const { maxPerQuery = 3 } = req.body || {};
    res.json({
      success: true,
      message: "Multi-lingual ingestion triggered in the background.",
    });

    try {
      await ingestMultiLingualYouTube({ maxPerQuery });
    } catch (err) {
      console.error("[LocalizationRoutes] Ingestion error:", err.message);
    }
  }
);

export default router;

