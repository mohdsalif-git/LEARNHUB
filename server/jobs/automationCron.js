/**
 * @file jobs/automationCron.js
 * @description Scheduled cron job that triggers the resource ingestion pipeline.
 *   - Runs daily at 03:00 AM server time (node-cron syntax: "0 3 * * *").
 *   - Accepts an optional Socket.io instance for live admin streaming.
 *   - Fully isolated: does not touch any existing routes, schemas, or cron jobs.
 *
 * USAGE (in server.js):
 *   import { startAutomationCron } from "./jobs/automationCron.js";
 *   startAutomationCron(io);   // pass the socket.io Server instance
 */

import cron from "node-cron";
import { runAutomationPipeline, setSocketIO } from "../services/automationEngine.js";

let _cronTask = null;

/**
 * Starts the daily automation ingestion cron job.
 * Safe to call multiple times — only one instance will run.
 *
 * @param {import("socket.io").Server|null} [io] - Socket.io server instance for live streaming.
 * @param {string} [schedule="0 3 * * *"] - node-cron schedule expression.
 */
export function startAutomationCron(io = null, schedule = "0 3 * * *") {
  if (_cronTask) {
    console.log("[AutomationCron] Already running — skipping duplicate start.");
    return;
  }

  if (io) setSocketIO(io);

  if (!cron.validate(schedule)) {
    console.error(`[AutomationCron] Invalid cron expression: "${schedule}". Cron NOT started.`);
    return;
  }

  _cronTask = cron.schedule(schedule, async () => {
    console.log(`[AutomationCron] 🚀 Triggered at ${new Date().toISOString()}`);
    try {
      const results = await runAutomationPipeline();
      console.log(`[AutomationCron] ✅ Done — ${results.totalSaved} new resources saved.`);
    } catch (err) {
      console.error(`[AutomationCron] ❌ Pipeline error: ${err.message}`);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata", // IST — adjust to your server TZ as needed
  });

  console.log(`[AutomationCron] ✅ Scheduled — cron: "${schedule}" (Asia/Kolkata).`);
}

/**
 * Stops the automation cron task (useful for graceful shutdown or testing).
 */
export function stopAutomationCron() {
  if (_cronTask) {
    _cronTask.stop();
    _cronTask = null;
    console.log("[AutomationCron] Stopped.");
  }
}
