/**
 * @file routes/automationAdminRoutes.js
 * @description Standalone Express router for automation admin controls.
 *   All routes are protected by existing `authenticate` + `authorizeAdmin` middleware.
 *   Mount in server.js: app.use("/api/admin", automationAdminRoutes);
 *
 * Endpoints (all under /api/admin):
 *   POST /automation/run          → Trigger full pipeline manually
 *   POST /automation/run/youtube  → Trigger YouTube ingestion only
 *   POST /automation/run/github   → Trigger GitHub ingestion only
 *   POST /automation/health-check → Trigger link health check manually
 *   GET  /automation/status       → Get last run metadata from memory
 *
 * Socket.io channels (read-only by admin client):
 *   automation:activity     → Progress, warnings, errors, pipeline events
 *   automation:new_resource → Newly saved resource details
 */

import express from "express";
import { authenticate, authorizeAdmin } from "../middleware/authMiddleware.js";
import {
  runAutomationPipeline,
  ingestYouTube,
  ingestGitHub,
  ingestOpenLibrary,
  ingestWikipedia,
  ingestArxiv,
  ingestFreeCodeCamp,
  setSocketIO,
} from "../services/automationEngine.js";
import { runHealthCheck } from "../jobs/healthCheckCron.js";

const router = express.Router();

// ─────────────────────────────────────────────
//  In-memory status store (lightweight, resets on restart)
// ─────────────────────────────────────────────

const automationStatus = {
  lastRun: null,         // ISO timestamp of last full pipeline run
  lastResult: null,      // { youtube, github, totalSaved }
  lastHealthCheck: null, // ISO timestamp of last health check
  lastHealthResult: null,// { checked, alive, dead, errors }
  isRunning: false,      // Guard against concurrent runs
};

// ─────────────────────────────────────────────
//  MIDDLEWARE: Inject Socket.io from app locals
// ─────────────────────────────────────────────

router.use((req, _res, next) => {
  const io = req.app.get("io");
  if (io) setSocketIO(io);
  next();
});

// ─────────────────────────────────────────────
//  POST /automation/run  — Full pipeline
// ─────────────────────────────────────────────

router.post(
  "/automation/run",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    if (automationStatus.isRunning) {
      return res.status(409).json({
        success: false,
        message: "Automation pipeline is already running. Please wait for it to finish.",
      });
    }

    const { ytMaxPerQuery = 5, ghMaxPerQuery = 5 } = req.body || {};

    // Acknowledge immediately — pipeline runs async
    res.json({
      success: true,
      message: "Automation pipeline started. Monitor progress on automation:activity socket channel.",
    });

    automationStatus.isRunning = true;
    try {
      const result = await runAutomationPipeline({ ytMaxPerQuery, ghMaxPerQuery });
      automationStatus.lastRun = result.ranAt;
      automationStatus.lastResult = result;
    } catch (err) {
      console.error("[AutomationRoute] Pipeline error:", err.message);
    } finally {
      automationStatus.isRunning = false;
    }
  }
);

// ─────────────────────────────────────────────
//  POST /automation/run/youtube  — YouTube only
// ─────────────────────────────────────────────

router.post(
  "/automation/run/youtube",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    const { maxPerQuery = 5 } = req.body || {};
    res.json({
      success: true,
      message: "YouTube ingestion started. Monitor on automation:activity socket channel.",
    });

    try {
      await ingestYouTube({ maxPerQuery });
    } catch (err) {
      console.error("[AutomationRoute] YouTube error:", err.message);
    }
  }
);

// ─────────────────────────────────────────────
//  POST /automation/run/github  — GitHub only
// ─────────────────────────────────────────────

router.post(
  "/automation/run/github",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    const { maxPerQuery = 5 } = req.body || {};
    res.json({
      success: true,
      message: "GitHub ingestion started. Monitor on automation:activity socket channel.",
    });

    try {
      await ingestGitHub({ maxPerQuery });
    } catch (err) {
      console.error("[AutomationRoute] GitHub error:", err.message);
    }
  }
);

// ─────────────────────────────────────────────
//  POST /automation/run/open-library  — Books only
// ─────────────────────────────────────────────

router.post(
  "/automation/run/open-library",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    const { maxPerQuery = 4 } = req.body || {};
    res.json({
      success: true,
      message: "Open Library books ingestion started. Monitor on automation:activity socket channel.",
    });

    try {
      await ingestOpenLibrary({ maxPerQuery });
    } catch (err) {
      console.error("[AutomationRoute] Open Library error:", err.message);
    }
  }
);

// ─────────────────────────────────────────────
//  POST /automation/run/wikipedia  — Wikipedia only
// ─────────────────────────────────────────────

router.post(
  "/automation/run/wikipedia",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    res.json({
      success: true,
      message: "Wikipedia topics ingestion started. Monitor on automation:activity socket channel.",
    });

    try {
      await ingestWikipedia();
    } catch (err) {
      console.error("[AutomationRoute] Wikipedia error:", err.message);
    }
  }
);

// ─────────────────────────────────────────────
//  POST /automation/run/arxiv  — Research papers only
// ─────────────────────────────────────────────

router.post(
  "/automation/run/arxiv",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    res.json({
      success: true,
      message: "arXiv papers ingestion started. Monitor on automation:activity socket channel.",
    });

    try {
      await ingestArxiv();
    } catch (err) {
      console.error("[AutomationRoute] arXiv error:", err.message);
    }
  }
);

// ─────────────────────────────────────────────
//  POST /automation/run/freecodecamp  — freeCodeCamp only
// ─────────────────────────────────────────────

router.post(
  "/automation/run/freecodecamp",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    res.json({
      success: true,
      message: "freeCodeCamp articles ingestion started. Monitor on automation:activity socket channel.",
    });

    try {
      await ingestFreeCodeCamp();
    } catch (err) {
      console.error("[AutomationRoute] freeCodeCamp error:", err.message);
    }
  }
);

// ─────────────────────────────────────────────
//  POST /automation/health-check  — Dead link sweep
// ─────────────────────────────────────────────

router.post(
  "/automation/health-check",
  authenticate,
  authorizeAdmin,
  async (req, res) => {
    if (automationStatus.isRunning) {
      return res.status(409).json({
        success: false,
        message: "A pipeline job is already running. Please wait.",
      });
    }

    res.json({
      success: true,
      message: "Health check started. Monitor dead links on automation:activity socket channel.",
    });

    automationStatus.isRunning = true;
    try {
      const result = await runHealthCheck();
      automationStatus.lastHealthCheck = new Date().toISOString();
      automationStatus.lastHealthResult = result;
    } catch (err) {
      console.error("[AutomationRoute] Health check error:", err.message);
    } finally {
      automationStatus.isRunning = false;
    }
  }
);

// ─────────────────────────────────────────────
//  GET /automation/status  — Last run metadata
// ─────────────────────────────────────────────

router.get(
  "/automation/status",
  authenticate,
  authorizeAdmin,
  (_req, res) => {
    res.json({
      success: true,
      data: {
        isRunning: automationStatus.isRunning,
        lastRun: automationStatus.lastRun,
        lastResult: automationStatus.lastResult,
        lastHealthCheck: automationStatus.lastHealthCheck,
        lastHealthResult: automationStatus.lastHealthResult,
      },
    });
  }
);

export default router;
