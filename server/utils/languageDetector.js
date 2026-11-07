/**
 * @file utils/languageDetector.js
 * @description Production-grade, zero-dependency language detector.
 *   Detects Devanagari (Hindi, Marathi), Tamil, Telugu, Bengali, Arabic,
 *   Russian, Japanese, Chinese, Spanish, French, German, and English.
 */

// ── Unicode Script Range Matchers ──────────────────────────────────────────
const SCRIPT_RANGES = [
  { name: "Hindi", regex: /[\u0900-\u097F]/g },       // Devanagari
  { name: "Tamil", regex: /[\u0B80-\u0BFF]/g },       // Tamil
  { name: "Telugu", regex: /[\u0C00-\u0C7F]/g },      // Telugu
  { name: "Bengali", regex: /[\u0980-\u09FF]/g },     // Bengali / Assamese
  { name: "Arabic", regex: /[\u0600-\u06FF]/g },      // Arabic / Urdu
  { name: "Japanese", regex: /[\u3040-\u309F\u30A0-\u30FF]/g }, // Hiragana / Katakana
  { name: "Chinese", regex: /[\u4E00-\u9FFF]/g },     // CJK Ideographs
  { name: "Russian", regex: /[\u0400-\u04FF]/g },     // Cyrillic
];

// ── Latin-Script Token Marker Lexicons ───────────────────────────────────────
const LATIN_MARKERS = {
  Spanish: [
    " para ", " con ", " cómo ", " curso ", " gratis ", " principiantes ",
    " introducción ", " qué es ", " tutorial de ", " aprender ", " completo ", " español "
  ],
  French: [
    " pour ", " débutants ", " cours ", " gratuit ", " comment ", " apprendre ",
    " tutoriel ", " introduction à ", " guide complet ", " français "
  ],
  German: [
    " für ", " anfänger ", " grundlagen ", " kurs ", " kostenlos ", " einführung ",
    " lernen ", " tutorial auf deutsch ", " erklärung ", " deutsch "
  ],
  Hindi_Latin: [
    " kaise ", " seekhe ", " sikhe ", " hindi me ", " hindi mai ", " poora ", " kare ",
    " ke bare me ", " shuruat ", " asan tarika "
  ]
};

/**
 * Detects the language of a resource from its title, description, and tags.
 * @param {string} text - Title, description, or combined metadata
 * @returns {string} Detected language (e.g. 'English', 'Hindi', 'Spanish', 'French', etc.)
 */
export function detectLanguage(text = "") {
  if (!text || typeof text !== "string") return "English";
  const str = text.trim();
  if (!str) return "English";

  // 1. Fast Unicode Script Analysis (Instant match with >= 3 characters)
  for (const { name, regex } of SCRIPT_RANGES) {
    const matches = str.match(regex);
    if (matches && matches.length >= 3) {
      return name;
    }
  }

  // 2. Latin Token Marker Analysis
  const lower = ` ${str.toLowerCase().replace(/[^a-záéíóúñäöüß\s]/g, " ")} `;

  // Check Romanized Hindi (Hinglish)
  let hinglishHits = 0;
  for (const token of LATIN_MARKERS.Hindi_Latin) {
    if (lower.includes(token)) hinglishHits++;
  }
  if (hinglishHits >= 2) return "Hindi";

  // Check Spanish
  let spanishHits = 0;
  for (const token of LATIN_MARKERS.Spanish) {
    if (lower.includes(token)) spanishHits++;
  }
  if (spanishHits >= 2) return "Spanish";

  // Check French
  let frenchHits = 0;
  for (const token of LATIN_MARKERS.French) {
    if (lower.includes(token)) frenchHits++;
  }
  if (frenchHits >= 2) return "French";

  // Check German
  let germanHits = 0;
  for (const token of LATIN_MARKERS.German) {
    if (lower.includes(token)) germanHits++;
  }
  if (germanHits >= 2) return "German";

  // Default fallback
  return "English";
}

/**
 * Standard list of supported language filters.
 */
export const SUPPORTED_LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "French",
  "German",
  "Tamil",
  "Telugu",
  "Bengali",
  "Arabic",
  "Japanese",
  "Chinese",
  "Russian",
];

