/**
 * Shared query helper utilities for sanitizing inputs and building MongoDB queries.
 */

/**
 * Escapes special regex characters to prevent ReDoS (Regular Expression Denial of Service).
 * @param {string} str
 * @returns {string}
 */
export function escapeRegex(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes tags from array or comma/whitespace separated string into a clean string array.
 * @param {string|string[]} tags
 * @returns {string[]}
 */
export function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
  }
  return [];
}
