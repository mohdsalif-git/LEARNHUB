/**
 * @file services/qualityScorer.js
 * @description Intelligent resource quality scorer for the LearnHub automation pipeline.
 *   Scores every candidate resource 0–5 before it is saved to MongoDB.
 *   Resources below the caller's minScore threshold are skipped, keeping the DB clean.
 *
 * Scoring signals (additive):
 *   1. Title quality      — length, structure, absence of spam/clickbait markers (0–1.0)
 *   2. Description depth  — word count, information density                        (0–1.0)
 *   3. Thumbnail presence — visual resources score higher                          (0–0.5)
 *   4. Tag richness       — 3–8 meaningful tags signal curated content             (0–0.5)
 *   5. Source reputation  — trusted platform bonus                                 (0–1.0)
 *   6. URL quality        — clean, known-good domains                              (0–0.5)
 *   7. Content legitimacy — penalise spam patterns in title/description            (−2.0 max)
 *
 * Max raw score: ~5.5 → clamped to 0–5.
 *
 * USAGE:
 *   import { scoreResource } from "./qualityScorer.js";
 *   const score = scoreResource({ title, description, thumbnail, tags, platform, url });
 *   if (score < 2.0) skip; // filter low-quality content
 */

// ── Spam / Low-Quality Signals ────────────────────────────────────────────────
const SPAM_PATTERNS = [
  /\bclick here\b/i, /\bmake money\b/i, /\bget rich\b/i, /\bweight loss\b.*\bfast\b/i,
  /\b100%\s*free\b/i, /\bno experience needed\b/i, /\beasy money\b/i,
  /\bwork from home\b.*\bfast\b/i, /\blimited time offer\b/i, /\bact now\b/i,
  /\bguaranteed results\b/i, /[\u{1F4B0}\u{1F4B8}\u{1F911}]/u, // money emojis
  /\bMLM\b/i, /\bpyramid\b/i,
];

const CLICKBAIT_PATTERNS = [
  /you won't believe/i, /shocking truth/i, /doctors hate/i,
  /one weird trick/i, /this will blow your mind/i, /they don't want you to know/i,
];

// ── Trusted Platform Reputation Scores ───────────────────────────────────────
const PLATFORM_SCORES = {
  YouTube:         0.8,
  GitHub:          0.9,
  "Official Docs": 1.0,
  MDN:             1.0,
  "Khan Academy":  1.0,
  Coursera:        0.9,
  edX:             0.9,
  "freeCodeCamp":  0.9,
  Google:          0.85,
  Edureka:         0.7,
  Other:           0.5,
};

// ── Trusted URL Domain Bonuses ────────────────────────────────────────────────
const TRUSTED_DOMAINS = [
  "wikipedia.org", "arxiv.org", "openlibrary.org", "khanacademy.org",
  "coursera.org", "edx.org", "mit.edu", "stanford.edu", "harvard.edu",
  "freecodecamp.org", "developer.mozilla.org", "docs.python.org",
  "docs.oracle.com", "developer.android.com", "docs.microsoft.com",
  "developers.google.com", "youtube.com", "github.com", "pubmed.ncbi.nlm.nih.gov",
  "scholar.google.com", "ncbi.nlm.nih.gov", "nature.com", "sciencedirect.com",
  "who.int", "cdc.gov", "nih.gov",
];

// ── Meaningful Word Filter ────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with",
  "by","from","up","about","into","through","is","are","was","were","be",
  "been","being","have","has","had","do","does","did","will","would","could",
  "should","may","might","shall","can","need","dare","ought","used","it","its",
]);

function meaningfulWords(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

// ── Main Scorer ───────────────────────────────────────────────────────────────

/**
 * Scores a resource candidate from 0 to 5.
 * @param {object} resource
 * @param {string} resource.title
 * @param {string} resource.description
 * @param {string} [resource.thumbnail]
 * @param {string[]} [resource.tags]
 * @param {string} [resource.platform]
 * @param {string} [resource.url]
 * @returns {number} Score clamped to [0, 5]
 */
export function scoreResource({ title = "", description = "", thumbnail = "", tags = [], platform = "Other", url = "" } = {}) {
  let score = 0;

  // ── 1. Title Quality (0–1.0) ──────────────────────────────────────────────
  const titleWords = meaningfulWords(title);
  const titleLen   = title.trim().length;
  if (titleLen >= 10 && titleLen <= 200) score += 0.4;
  if (titleWords.length >= 3)            score += 0.3;
  if (titleWords.length >= 5)            score += 0.2;
  if (titleLen > 20 && titleLen < 120)   score += 0.1;

  // ── 2. Description Depth (0–1.0) ─────────────────────────────────────────
  const descWords = meaningfulWords(description);
  if (descWords.length >= 10)  score += 0.3;
  if (descWords.length >= 25)  score += 0.3;
  if (descWords.length >= 50)  score += 0.2;
  if (descWords.length >= 80)  score += 0.2;

  // ── 3. Thumbnail Presence (0–0.5) ────────────────────────────────────────
  if (thumbnail && thumbnail.startsWith("http")) score += 0.5;

  // ── 4. Tag Richness (0–0.5) ──────────────────────────────────────────────
  const tagCount = (tags || []).length;
  if (tagCount >= 1) score += 0.1;
  if (tagCount >= 3) score += 0.2;
  if (tagCount >= 5) score += 0.2;

  // ── 5. Platform Reputation (0–1.0) ───────────────────────────────────────
  score += PLATFORM_SCORES[platform] ?? 0.4;

  // ── 6. URL Domain Bonus (0–0.5) ──────────────────────────────────────────
  try {
    const hostname = url ? new URL(url).hostname.replace("www.", "") : "";
    if (TRUSTED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      score += 0.5;
    }
  } catch {
    // Invalid URL — no bonus
  }

  // ── 7. Spam / Clickbait Penalty (−2.0 max) ───────────────────────────────
  const combined = `${title} ${description}`.toLowerCase();
  let penalty = 0;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(combined)) penalty += 0.5;
  }
  for (const pattern of CLICKBAIT_PATTERNS) {
    if (pattern.test(combined)) penalty += 0.3;
  }
  score -= Math.min(penalty, 2.0);

  // ── Clamp to [0, 5] ──────────────────────────────────────────────────────
  return Math.max(0, Math.min(5, parseFloat(score.toFixed(2))));
}

/**
 * Returns a human-readable quality label for a score.
 * @param {number} score
 * @returns {'Excellent'|'Good'|'Fair'|'Poor'|'Rejected'}
 */
export function qualityLabel(score) {
  if (score >= 4.0) return "Excellent";
  if (score >= 3.0) return "Good";
  if (score >= 2.0) return "Fair";
  if (score >= 1.0) return "Poor";
  return "Rejected";
}
