/**
 * @file jobs/healthCheckCron.js
 * @description Self-healing link health check cron job.
 *   - Runs every Sunday at 02:00 AM (or configurable schedule).
 *   - Sends HTTP HEAD requests to every published resource URL.
 *   - Sets `isPublished: false` on dead links (404 / connection refused / timeout).
 *     NOTE: Since `isPublished` does not exist in the current schema, the job instead
 *     sets `status: "pending"` and appends a `reviewNotes` flag so admins can review.
 *     This is the safest non-destructive way to flag dead links without schema migration.
 *   - All activity streamed to Socket.io `automation:activity` channel.
 *   - Zero destructive operations on existing records (only reviewNotes + status touched
 *     on confirmed dead resources).
 *
 * USAGE (in server.js):
 *   import { startHealthCheckCron } from "./jobs/healthCheckCron.js";
 *   startHealthCheckCron(io);
 */

import https from "https";
import http from "http";
import cron from "node-cron";
import Resource from "../models/Resource.js";

let _cronTask = null;
let _io = null;

// ─────────────────────────────────────────────
//  SOCKET.IO EMITTER (isolated channel)
// ─────────────────────────────────────────────

function emit(payload) {
  try {
    if (_io) _io.emit("automation:activity", { ...payload, ts: new Date().toISOString() });
  } catch (_e) {
    /* never crash on emit failure */
  }
}

// ─────────────────────────────────────────────
//  HEAD REQUEST CHECKER
// ─────────────────────────────────────────────

const DEAD_STATUS_CODES = new Set([404, 410, 451]);
const TIMEOUT_MS = 10000;

/**
 * Sends an HTTP HEAD request to the given URL.
 * @param {string} url
 * @returns {Promise<{alive: boolean, statusCode: number|null, reason: string}>}
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    let resolved = false;
    const done = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    try {
      const protocol = url.startsWith("https") ? https : http;
      const urlObj = new URL(url);
      const reqOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (url.startsWith("https") ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: "HEAD",
        headers: {
          "User-Agent": "LearnHub-HealthBot/1.0",
          Accept: "*/*",
        },
        timeout: TIMEOUT_MS,
      };

      const req = protocol.request(reqOptions, (res) => {
        const code = res.statusCode;
        const alive = !DEAD_STATUS_CODES.has(code) && code < 500;
        done({
          alive,
          statusCode: code,
          reason: alive ? "ok" : `HTTP ${code}`,
        });
        // Consume the response to free the socket
        res.resume();
      });

      req.on("timeout", () => {
        req.destroy();
        done({ alive: false, statusCode: null, reason: "timeout" });
      });

      req.on("error", (err) => {
        done({ alive: false, statusCode: null, reason: err.code || err.message });
      });

      req.end();
    } catch (parseErr) {
      done({ alive: false, statusCode: null, reason: `URL parse error: ${parseErr.message}` });
    }
  });
}

// ─────────────────────────────────────────────
//  HEALTH CHECK RUNNER
// ─────────────────────────────────────────────

const BATCH_SIZE = 20;       // Resources checked concurrently per batch
const INTER_BATCH_DELAY = 1000; // ms between batches (rate-limit courtesy)

/**
 * Runs the full link health check across all approved resources.
 * @returns {Promise<{checked: number, dead: number, alive: number, errors: number}>}
 */
export async function runHealthCheck() {
  emit({
    type: "health_check_start",
    source: "HealthCheck",
    message: "Starting link health check on all approved resources.",
  });

  let checked = 0, dead = 0, alive = 0, errors = 0;

  // Only check approved resources to avoid re-flagging already-pending ones
  const resources = await Resource.find({ status: "approved" })
    .select("_id url title")
    .lean();

  emit({
    type: "info",
    source: "HealthCheck",
    message: `Found ${resources.length} approved resources to check.`,
  });

  // Process in batches to avoid hammering the network
  for (let i = 0; i < resources.length; i += BATCH_SIZE) {
    const batch = resources.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (resource) => {
        try {
          const { alive: isAlive, statusCode, reason } = await checkUrl(resource.url);
          checked++;

          if (!isAlive) {
            dead++;
            // Flag as pending for admin review — $set only on targeted dead-link fields
            await Resource.updateOne(
              { _id: resource._id },
              {
                $set: {
                  status: "pending",
                  reviewNotes: `[HealthBot ${new Date().toISOString()}] Dead link detected — ${reason} (HTTP ${statusCode ?? "N/A"}). Please verify or remove.`,
                },
              }
            );

            emit({
              type: "dead_link",
              source: "HealthCheck",
              message: `Dead link flagged: "${resource.title}" — ${reason}`,
              url: resource.url,
              statusCode,
            });
          } else {
            alive++;
          }
        } catch (err) {
          errors++;
          emit({
            type: "error",
            source: "HealthCheck",
            message: `Error checking "${resource.url}": ${err.message}`,
          });
        }
      })
    );

    // Emit batch progress
    emit({
      type: "progress",
      source: "HealthCheck",
      message: `Batch ${Math.floor(i / BATCH_SIZE) + 1} done — checked ${Math.min(i + BATCH_SIZE, resources.length)}/${resources.length}.`,
    });

    // Inter-batch delay
    if (i + BATCH_SIZE < resources.length) {
      await new Promise((r) => setTimeout(r, INTER_BATCH_DELAY));
    }
  }

  emit({
    type: "health_check_complete",
    source: "HealthCheck",
    message: `Health check complete — alive: ${alive}, dead: ${dead}, errors: ${errors}.`,
    stats: { checked, alive, dead, errors },
  });

  return { checked, dead, alive, errors };
}

// ─────────────────────────────────────────────
//  CRON SCHEDULER
// ─────────────────────────────────────────────

/**
 * Starts the weekly link health check cron.
 * Default: Every Sunday at 02:00 AM IST.
 *
 * @param {import("socket.io").Server|null} [io]
 * @param {string} [schedule="0 2 * * 0"]
 */
export function startHealthCheckCron(io = null, schedule = "0 2 * * 0") {
  if (_cronTask) {
    console.log("[HealthCheckCron] Already running — skipping duplicate start.");
    return;
  }

  if (io) _io = io;

  if (!cron.validate(schedule)) {
    console.error(`[HealthCheckCron] Invalid cron expression: "${schedule}". NOT started.`);
    return;
  }

  _cronTask = cron.schedule(schedule, async () => {
    console.log(`[HealthCheckCron] 🔍 Triggered at ${new Date().toISOString()}`);
    try {
      const results = await runHealthCheck();
      console.log(`[HealthCheckCron] ✅ Done — dead: ${results.dead}, alive: ${results.alive}.`);
    } catch (err) {
      console.error(`[HealthCheckCron] ❌ Error: ${err.message}`);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata",
  });

  console.log(`[HealthCheckCron] ✅ Scheduled — cron: "${schedule}" (Asia/Kolkata).`);
}

/**
 * Stops the health check cron (graceful shutdown / testing).
 */
export function stopHealthCheckCron() {
  if (_cronTask) {
    _cronTask.stop();
    _cronTask = null;
    console.log("[HealthCheckCron] Stopped.");
  }
}
