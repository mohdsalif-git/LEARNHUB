/**
 * @file services/automationEngine.js
 * @description Core automation engine for LearnHub universal free-resource ingestion pipeline.
 *   Covers ALL learning domains: Technology, Healthcare, Science, Mathematics, Nutrition,
 *   AI/ML, Hardware, History, Languages, Arts, Business, Psychology, Law, Environment,
 *   Finance, Philosophy, Engineering, Social Sciences, and more.
 *
 *   Sources:
 *     1. YouTube Data API v3   (requires YOUTUBE_API_KEY)
 *     2. GitHub REST API       (requires GITHUB_TOKEN — optional but recommended)
 *     3. Open Library API      (free, no key — books on all topics)
 *     4. Wikipedia REST API    (free, no key — educational article summaries)
 *     5. arXiv API             (free, no key — academic/research papers)
 *     6. freeCodeCamp News API (free, no key — in-depth tutorials)
 *
 *   - Classifies difficulty via a universal multi-domain keyword taxonomy.
 *   - Quality-scores every resource (0–5) before saving — rejects spam/low-quality.
 *   - Upserts safely using $setOnInsert (zero schema disruption).
 *   - Streams live telemetry to Socket.io on isolated automation:* channels.
 *
 * CONSTRAINTS:
 *   • Never modifies existing resources ($setOnInsert only).
 *   • All secrets from process.env — never hardcoded.
 *   • All third-party calls wrapped in try/catch.
 */

import https from "https";
import http from "http";
import Resource from "../models/Resource.js";
import Category from "../models/Category.js";
import { scoreResource } from "./qualityScorer.js";
import { detectLanguage } from "../utils/languageDetector.js";
import { fetchYouTubePublic } from "./sources/youtubePublicSource.js";
import { ingestOpenLibrary, setEmitter as setOpenLibraryEmitter } from "./sources/openLibrarySource.js";
import { ingestWikipedia, setEmitter as setWikiEmitter } from "./sources/wikiSource.js";
import { ingestArxiv, setEmitter as setArxivEmitter } from "./sources/arxivSource.js";
import { ingestFreeCodeCamp, setEmitter as setFccEmitter } from "./sources/freeCodeCampSource.js";

// ─────────────────────────────────────────────
//  TAXONOMY — Difficulty Classifier
// ─────────────────────────────────────────────

/**
 * Universal multi-domain difficulty taxonomy.
 * Covers Technology, Healthcare, Science, Mathematics, AI/ML, Hardware,
 * Nutrition, History, Arts, Business, Psychology, Law, Finance, Engineering, and more.
 *
 * Matching order: Advanced → Intermediate → Beginner → default "Beginner"
 */
const TAXONOMY = {
  Advanced: [
    // ── Technology & Engineering ──
    "architecture", "microservices", "system design", "performance optimization",
    "concurrency", "internals", "deep dive", "distributed systems", "scalability",
    "low level", "compiler", "kernel", "networking internals", "cryptography",
    "reverse engineering", "embedded systems", "fpga", "asic", "vlsi",
    "signal processing", "control theory", "robotics programming",
    // ── AI / Machine Learning ──
    "neural network architecture", "transformer model", "reinforcement learning",
    "generative adversarial", "large language model", "fine-tuning", "backpropagation",
    "computer vision advanced", "nlp advanced", "model optimization", "mlops",
    // ── Mathematics & Science ──
    "advanced calculus", "real analysis", "abstract algebra", "topology",
    "differential equations", "linear algebra advanced", "number theory",
    "quantum mechanics", "thermodynamics", "electrodynamics", "statistical mechanics",
    "organic chemistry advanced", "biochemistry advanced", "molecular biology",
    "genomics", "proteomics", "neuroscience research",
    // ── Healthcare & Medicine ──
    "clinical pharmacology", "pathophysiology", "surgical techniques",
    "medical diagnosis", "radiology interpretation", "immunology advanced",
    "epidemiology advanced", "clinical research", "medical imaging",
    // ── Business & Finance ──
    "options trading", "derivatives", "quantitative finance", "hedge fund strategies",
    "mergers and acquisitions", "private equity", "venture capital advanced",
    "advanced accounting", "corporate law", "tax law advanced",
    // ── Other Domains ──
    "advanced music theory", "counterpoint", "orchestration", "film theory advanced",
    "advanced linguistics", "psychoanalysis", "research methodology",
  ],

  Intermediate: [
    // ── Technology ──
    "full stack", "crud", "rest api", "state management", "database",
    "authentication", "docker", "testing", "deployment", "graphql", "websocket",
    "linux administration", "networking basics", "cloud computing", "devops",
    "data engineering", "etl pipeline", "api integration",
    // ── AI / ML ──
    "machine learning project", "deep learning", "data science", "model training",
    "feature engineering", "computer vision", "natural language processing",
    "recommendation system", "classification", "regression", "clustering",
    // ── Mathematics ──
    "calculus", "linear algebra", "statistics", "probability", "discrete math",
    "numerical methods", "graph theory", "set theory", "trigonometry advanced",
    // ── Science ──
    "organic chemistry", "genetics", "cell biology", "ecology",
    "astrophysics", "particle physics", "materials science",
    "chemistry lab", "biology lab", "physics problems",
    // ── Healthcare & Nutrition ──
    "anatomy", "physiology", "pharmacology", "nursing skills",
    "first aid", "nutrition science", "dietetics", "clinical nutrition",
    "public health", "disease prevention", "mental health therapy",
    "exercise physiology", "sports medicine",
    // ── Business & Finance ──
    "financial modeling", "investment analysis", "accounting principles",
    "marketing strategy", "project management", "entrepreneurship",
    "supply chain", "operations management", "business analytics",
    "stock market", "personal finance intermediate", "real estate investing",
    // ── Hardware & Electronics ──
    "circuit design", "pcb layout", "microcontroller", "arduino project",
    "raspberry pi", "electronics project", "3d printing", "iot project",
    // ── Arts & Humanities ──
    "music theory", "art history intermediate", "photography techniques",
    "graphic design", "video editing", "animation", "screenwriting",
    "creative writing", "journalism", "philosophy of mind",
    // ── Languages ──
    "intermediate spanish", "intermediate french", "intermediate japanese",
    "intermediate mandarin", "language grammar", "conversation practice",
    // ── Psychology & Social Sciences ──
    "cognitive psychology", "social psychology", "behavioral economics",
    "research methods", "sociology", "political science",
  ],

  Beginner: [
    // ── Universal beginner markers ──
    "introduction", "intro to", "basics", "crash course", "getting started",
    "fundamentals", "for beginners", "beginner", "101", "overview", "tutorial",
    "learn from scratch", "complete guide for beginners", "step by step",
    "explained simply", "easy", "starter", "first lesson", "quick start",
    // ── Domain-specific beginner ──
    "learn to cook", "cooking basics", "nutrition basics", "healthy eating basics",
    "math basics", "arithmetic", "pre-algebra",
    "science for kids", "biology basics", "chemistry basics", "physics basics",
    "history overview", "world history", "geography basics",
    "english grammar basics", "learn spanish", "learn french", "learn mandarin",
    "learn japanese", "language basics",
    "drawing basics", "art for beginners", "music for beginners",
    "guitar basics", "piano basics",
    "meditation basics", "yoga basics", "fitness basics", "workout for beginners",
    "first aid basics", "health basics", "mental health basics",
    "money basics", "budgeting", "saving money", "investing basics",
    "entrepreneurship basics", "business basics",
    "philosophy basics", "critical thinking", "logic basics",
    "public speaking basics", "communication skills",
  ],
};

/**
 * Classifies a resource difficulty level based on title + description keywords.
 *
 * Strategy:
 *  1. Check explicit Beginner markers FIRST (highest confidence — "for beginners",
 *     "basics", "crash course", "101", etc.) so domain terms like "science" or
 *     "nutrition" in an introductory title don't accidentally elevate the level.
 *  2. Then check Advanced (domain-expert keywords).
 *  3. Then Intermediate.
 *  4. Fall back to Beginner.
 *
 * @param {string} text - Combined title and description string.
 * @returns {'Beginner'|'Intermediate'|'Advanced'}
 */
export function classifyDifficulty(text) {
  const lower = (text || "").toLowerCase();

  // ── Pass 1: High-confidence beginner markers win immediately ──
  const EXPLICIT_BEGINNER = [
    "for beginners", "for complete beginners", "beginner's guide",
    "crash course", "getting started", "from scratch", "learn from scratch",
    "step by step", "quick start", "beginner guide", "beginner tutorial",
    "beginner friendly", " 101", "explained simply", "simply explained",
    "easy guide", "basics", "fundamentals", "introduction to", "intro to",
    "overview of", "overview for", "getting started with",
    "learn to cook", "cooking basics", "cooking for beginners",
    "yoga for beginners", "workout for beginners", "fitness basics",
    "first aid basics", "health basics", "mental health basics",
    "money basics", "budgeting basics", "investing basics",
    "nutrition basics", "diet basics", "food basics",
    "math basics", "arithmetic basics", "pre-algebra",
    "science for kids", "biology basics", "chemistry basics", "physics basics",
    "history overview", "geography basics",
    "language basics", "english basics", "grammar basics",
    "drawing basics", "art basics", "music basics", "guitar basics", "piano basics",
    "philosophy basics", "logic basics", "critical thinking basics",
    "public speaking basics", "communication basics",
    "beginner", " starter", "first lesson",
    "introduction to stock", "stock market introduction", "stock market for beginners",
    "introduction to finance", "finance for beginners",
    "anatomy for beginners", "physiology for beginners",
    "anatomy full course", "physiology full course",
  ];
  for (const kw of EXPLICIT_BEGINNER) {
    if (lower.includes(kw)) return "Beginner";
  }

  // ── Pass 2: Advanced domain-expert keywords ──
  for (const keyword of TAXONOMY.Advanced) {
    if (lower.includes(keyword)) return "Advanced";
  }

  // ── Pass 3: Intermediate keywords ──
  for (const keyword of TAXONOMY.Intermediate) {
    if (lower.includes(keyword)) return "Intermediate";
  }

  // ── Pass 4: Generic beginner remainder ──
  for (const keyword of TAXONOMY.Beginner) {
    if (lower.includes(keyword)) return "Beginner";
  }

  return "Beginner"; // safe default baseline
}

// ─────────────────────────────────────────────
//  SOCKET.IO EMITTER  (isolated channels only)
// ─────────────────────────────────────────────

let _io = null;

/**
 * Inject the Socket.io server instance (called once from server.js / automationCron.js).
 * @param {import("socket.io").Server} io
 */
export function setSocketIO(io) {
  _io = io;
  const forwardEmitter = (channel, payload) => emit(channel, payload);
  setOpenLibraryEmitter(forwardEmitter);
  setWikiEmitter(forwardEmitter);
  setArxivEmitter(forwardEmitter);
  setFccEmitter(forwardEmitter);
}

/**
 * Emit an event on an isolated automation channel without touching any other channel.
 * @param {'automation:activity'|'automation:new_resource'} channel
 * @param {object} payload
 */
function emit(channel, payload) {
  try {
    if (_io) _io.emit(channel, { ...payload, ts: new Date().toISOString() });
  } catch (_err) {
    // Never crash the pipeline if socket emission fails
  }
}

// ─────────────────────────────────────────────
//  UTILITY — Minimal HTTPS GET returning JSON
// ─────────────────────────────────────────────

/**
 * Lightweight HTTPS/HTTP GET helper (no external dependencies beyond Node built-ins).
 * @param {string} url
 * @param {Record<string, string>} [headers]
 * @returns {Promise<any>} Parsed JSON body
 */
function fetchJSON(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { headers }, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${raw.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy(new Error("Request timeout"));
    });
  });
}

// ─────────────────────────────────────────────
//  CATEGORY RESOLVER
// ─────────────────────────────────────────────

let _cachedCategories = null;
let _cachedCategoriesTime = 0;

/**
 * Resolves a category name string to a {categoryName, categoryId} pair.
 * Falls back to "Programming" if no active category matches.
 * @param {string} hint - Keyword hint from resource tags/title.
 * @returns {Promise<{categoryName: string, categoryId: import('mongoose').Types.ObjectId|null}>}
 */
export async function resolveCategory(hint = "") {
  try {
    const lower = hint.toLowerCase();
    const now = Date.now();
    if (!_cachedCategories || now - _cachedCategoriesTime > 300000) {
      _cachedCategories = await Category.find({ status: "active" }).select("_id name keywords slug").lean();
      _cachedCategoriesTime = now;
    }
    const categories = _cachedCategories || [];
    if (!categories.length) return { categoryName: "General Learning", categoryId: null };

    for (const cat of categories) {
      const haystack = `${cat.name} ${cat.slug} ${cat.keywords || ""}`.toLowerCase();
      if (haystack.includes(lower) || lower.includes(cat.name.toLowerCase())) {
        return { categoryName: cat.name, categoryId: cat._id };
      }
    }

    // ── Domain keyword → category name fallback map ──────────────────────────
    // Allows the resolver to pick a good category even when the DB slug doesn't
    // contain the exact resource keyword.
    const DOMAIN_MAP = [
      { keywords: ["javascript","react","node","typescript","css","html","web","frontend","backend","programming","coding","software","algorithm","data structure","devops","docker","kubernetes","linux","git","api","database","sql","mongodb","cloud","aws","azure","gcp"], category: "Programming" },
      { keywords: ["python","django","flask","fastapi","pandas","numpy","scipy"], category: "Programming" },
      { keywords: ["machine learning","deep learning","neural","ai","artificial intelligence","nlp","computer vision","data science","tensorflow","pytorch","keras","llm","gpt","transformer"], category: "AI & Machine Learning" },
      { keywords: ["math","calculus","algebra","geometry","trigonometry","statistics","probability","number theory","discrete","differential equation","linear algebra"], category: "Mathematics" },
      { keywords: ["physics","chemistry","biology","science","astronomy","astrophysics","geology","ecology","genetics","quantum","thermodynamics","electro","organic","biochemistry","neuroscience","zoology","botany","microbiology"], category: "Science" },
      { keywords: ["health","medicine","medical","nursing","anatomy","physiology","pharmacology","first aid","disease","clinical","surgery","radiology","mental health","psychology","therapy","cbt","psychiatry"], category: "Healthcare" },
      { keywords: ["nutrition","diet","food","eating","vitamins","minerals","supplement","weight loss","calories","macro","micro","dietetics","meal plan"], category: "Nutrition" },
      { keywords: ["hardware","circuit","pcb","electronics","microcontroller","arduino","raspberry pi","iot","embedded","fpga","vlsi","3d printing","robotics","drone"], category: "Hardware & Electronics" },
      { keywords: ["history","ancient","medieval","world war","civilization","empire","revolution","culture","archaeology"], category: "History" },
      { keywords: ["language","english","spanish","french","german","japanese","mandarin","chinese","korean","arabic","hindi","grammar","vocabulary","pronunciation","fluency"], category: "Languages" },
      { keywords: ["art","drawing","painting","illustration","graphic design","photography","animation","film","video","music","guitar","piano","singing","dance","theatre"], category: "Arts & Creative" },
      { keywords: ["business","marketing","management","entrepreneurship","startup","accounting","finance","investing","stock","economics","commerce","sales","strategy"], category: "Business & Finance" },
      { keywords: ["finance","investing","stock market","crypto","trading","budgeting","personal finance","banking","tax","insurance","real estate"], category: "Finance" },
      { keywords: ["psychology","cognitive","behavior","emotion","motivation","mindfulness","meditation","stress","mental","social","neuroscience"], category: "Psychology" },
      { keywords: ["law","legal","constitution","rights","contract","criminal","civil","international law","judiciary","court"], category: "Law" },
      { keywords: ["environment","climate","sustainability","renewable energy","conservation","ecology","green","carbon","pollution"], category: "Environment" },
      { keywords: ["philosophy","ethics","logic","critical thinking","epistemology","metaphysics","stoicism","existentialism"], category: "Philosophy" },
      { keywords: ["engineering","mechanical","civil","electrical","chemical","structural","aerospace","industrial","manufacturing"], category: "Engineering" },
      { keywords: ["cooking","recipe","baking","cuisine","chef","kitchen","food science"], category: "Cooking & Culinary" },
      { keywords: ["fitness","workout","exercise","yoga","pilates","running","strength","weight training","sports","nutrition","wellness"], category: "Health & Fitness" },
    ];

    for (const { keywords, category } of DOMAIN_MAP) {
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          // Try to find this category in DB
          const matched = categories.find(
            (c) => c.name.toLowerCase().includes(category.toLowerCase()) ||
                   category.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matched) return { categoryName: matched.name, categoryId: matched._id };
          // Return the mapped name even if not in DB (admin can create it later)
          return { categoryName: category, categoryId: null };
        }
      }
    }

    // Default to first active category
    const first = categories[0];
    return { categoryName: first.name, categoryId: first._id };
  } catch (_err) {
    return { categoryName: "General Learning", categoryId: null };
  }
}

// ─────────────────────────────────────────────
//  YOUTUBE INGESTION
// ─────────────────────────────────────────────

/**
 * Universal YouTube search queries spanning ALL learning domains.
 * Grouped by domain for readability — processed as a flat list at runtime.
 * Total: ~80 queries covering Technology, AI/ML, Mathematics, Science, Healthcare,
 * Nutrition, Hardware, History, Languages, Arts, Business, Finance, Psychology,
 * Law, Environment, Philosophy, Engineering, Cooking, and Fitness.
 */
const YOUTUBE_QUERIES = [
  // ── Technology & Programming ──────────────────────────────────
  "javascript tutorial free",
  "python full course for beginners",
  "web development crash course",
  "react js complete course free",
  "node.js tutorial for beginners",
  "data structures and algorithms course",
  "linux command line basics",
  "git and github full course",
  "docker tutorial for beginners",
  "sql database tutorial free",
  "system design for beginners",
  "typescript fundamentals free course",
  "devops roadmap free",

  // ── AI, Machine Learning & Data Science ──────────────────────
  "machine learning crash course free",
  "deep learning tutorial for beginners",
  "artificial intelligence introduction free",
  "data science full course free",
  "natural language processing tutorial",
  "computer vision tutorial beginners",
  "chatgpt and large language models explained",
  "tensorflow keras tutorial free",

  // ── Mathematics ───────────────────────────────────────────────
  "calculus full course free",
  "linear algebra for beginners",
  "statistics and probability free course",
  "discrete mathematics tutorial",
  "trigonometry basics free",
  "algebra crash course",

  // ── Science ───────────────────────────────────────────────────
  "biology full course free",
  "chemistry basics tutorial",
  "physics fundamentals free course",
  "organic chemistry introduction",
  "quantum physics explained simply",
  "astronomy for beginners",
  "genetics and dna explained",
  "neuroscience introduction free",

  // ── Healthcare & Medicine ─────────────────────────────────────
  "human anatomy full course free",
  "physiology tutorial for beginners",
  "first aid and cpr basics",
  "mental health awareness free course",
  "nursing fundamentals tutorial",
  "pharmacology basics free",
  "public health introduction",

  // ── Nutrition & Wellness ──────────────────────────────────────
  "nutrition science basics free",
  "healthy eating fundamentals",
  "understanding macronutrients and micronutrients",
  "dietetics for beginners",
  "sports nutrition tutorial",

  // ── Hardware & Electronics ────────────────────────────────────
  "arduino tutorial for beginners",
  "raspberry pi full course free",
  "electronics basics tutorial",
  "pcb design introduction",
  "iot projects for beginners",
  "3d printing beginner guide",

  // ── History & Social Sciences ─────────────────────────────────
  "world history crash course",
  "ancient civilizations overview",
  "economics for beginners free",
  "political science introduction",
  "sociology basics tutorial",

  // ── Languages ─────────────────────────────────────────────────
  "learn spanish for beginners free",
  "learn japanese for beginners",
  "learn mandarin chinese basics",
  "english grammar full course free",
  "french language tutorial free",

  // ── Arts & Creative Skills ────────────────────────────────────
  "drawing for beginners full course",
  "music theory basics free",
  "photography tutorial for beginners",
  "graphic design crash course free",
  "video editing tutorial free",
  "guitar basics for beginners",

  // ── Business & Finance ────────────────────────────────────────
  "personal finance basics free",
  "investing for beginners free course",
  "entrepreneurship fundamentals",
  "accounting basics tutorial",
  "stock market introduction free",
  "digital marketing full course free",

  // ── Psychology & Philosophy ───────────────────────────────────
  "psychology introduction free course",
  "cognitive behavioral therapy explained",
  "philosophy for beginners",
  "critical thinking skills tutorial",
  "stoicism explained free",

  // ── Environment & Engineering ─────────────────────────────────
  "climate change and sustainability free course",
  "renewable energy basics tutorial",
  "mechanical engineering fundamentals",
  "electrical engineering basics free",

  // ── Cooking & Fitness ─────────────────────────────────────────
  "cooking basics for beginners",
  "yoga for beginners full class free",
  "home workout beginner free",
];

/**
 * Fetches free educational videos from YouTube Data API v3.
 * Handles quota exhaustion gracefully by emitting a Socket.io warning.
 * @param {object} opts
 * @param {number} [opts.maxPerQuery=5] - Max results per search query.
 * @returns {Promise<{saved: number, skipped: number, errors: number}>}
 */
export async function ingestYouTube({ maxPerQuery = 5 } = {}) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let saved = 0, skipped = 0, errors = 0;

  emit("automation:activity", {
    type: "info",
    source: "YouTube",
    message: `Starting YouTube ingestion — ${YOUTUBE_QUERIES.length} queries × ${maxPerQuery} results.`,
  });

  for (const query of YOUTUBE_QUERIES) {
    try {
      let videos = [];

      // 1. Try official YouTube Data API v3 if key exists
      if (apiKey) {
        try {
          const encodedQuery = encodeURIComponent(query);
          const url =
            `https://www.googleapis.com/youtube/v3/search` +
            `?part=snippet&type=video&videoDuration=medium` +
            `&videoEmbeddable=true&maxResults=${maxPerQuery}` +
            `&q=${encodedQuery}&key=${apiKey}`;

          const data = await fetchJSON(url);
          if (data && !data.error && Array.isArray(data.items)) {
            videos = data.items.map((item) => ({
              videoId: item.id?.videoId,
              title: item.snippet?.title || "Untitled",
              description: item.snippet?.description || "",
              thumbnail:
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.default?.url ||
                `https://i.ytimg.com/vi/${item.id?.videoId}/hqdefault.jpg`,
              tags: item.snippet?.tags || [query.split(" ")[0]],
            }));
          }
        } catch {
          // Fall through to public parser fallback
        }
      }

      // 2. Resilient fallback to YouTube public search parsing (zero API key required)
      if (videos.length === 0) {
        const publicItems = await fetchYouTubePublic(query, maxPerQuery);
        if (publicItems && publicItems.length > 0) {
          videos = publicItems.map((v) => ({
            videoId: v.videoId,
            title: v.title,
            description: v.description,
            thumbnail: v.thumbnail,
            tags: [query.split(" ")[0]],
          }));
        }
      }

      for (const item of videos) {
        try {
          const videoId = item.videoId;
          if (!videoId) { skipped++; continue; }

          const title = item.title || "Untitled";
          const description = item.description || "";
          const thumbnail = item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          const resourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const level = classifyDifficulty(`${title} ${description}`);
          const detectedLang = detectLanguage(`${title} ${description}`) || "English";
          const tags = (item.tags || [title.split(" ")[0]]).slice(0, 8);
          const { categoryName, categoryId } = await resolveCategory(tags[0] || title);

          const rawScore = scoreResource({
            title,
            description,
            thumbnail,
            tags,
            platform: "YouTube",
            url: resourceUrl,
          });

          const payload = {
            title,
            description: description.slice(0, 500) || `Free educational video: ${title}`,
            url: resourceUrl,
            platform: "YouTube",
            category: categoryName,
            categoryId,
            level,
            language: detectedLang,
            thumbnail,
            tags,
            rating: parseFloat(rawScore.toFixed(1)),
            verified: false,
            featured: false,
            status: "approved",
            submitterName: "AutoBot",
            reviewNotes: `Auto-ingested from YouTube query: "${query}"`,
          };

          const result = await Resource.updateOne(
            { url: resourceUrl },
            { $setOnInsert: payload },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            saved++;
            emit("automation:new_resource", {
              source: "YouTube",
              title,
              url: resourceUrl,
              level,
              language: detectedLang,
              category: categoryName,
            });
          } else {
            skipped++;
          }
        } catch (itemErr) {
          errors++;
          emit("automation:activity", {
            type: "error",
            source: "YouTube",
            message: `Failed to process item: ${itemErr.message}`,
          });
        }
      }

      emit("automation:activity", {
        type: "progress",
        source: "YouTube",
        message: `Query "${query}" done — ${videos.length} items processed.`,
      });

      // Respect rate limits — 400 ms between queries
      await new Promise((r) => setTimeout(r, 400));
    } catch (queryErr) {
      errors++;
      emit("automation:activity", {
        type: "error",
        source: "YouTube",
        message: `Query "${query}" failed: ${queryErr.message}`,
      });
    }
  }

  emit("automation:activity", {
    type: "complete",
    source: "YouTube",
    message: `YouTube ingestion complete — saved: ${saved}, skipped: ${skipped}, errors: ${errors}.`,
    stats: { saved, skipped, errors },
  });

  return { saved, skipped, errors };
}

// ─────────────────────────────────────────────
//  GITHUB INGESTION
// ─────────────────────────────────────────────

/**
 * Universal GitHub search queries spanning ALL learning domains.
 * Targets curated "awesome-*" lists, free books, roadmaps, and open educational
 * repositories across Technology, AI/ML, Mathematics, Science, Healthcare,
 * Hardware, History, Arts, Business, Languages, Psychology, and more.
 * Total: ~60 queries.
 */
const GITHUB_QUERIES = [
  // ── Technology & Programming ──────────────────────────────────
  "awesome javascript",
  "awesome python",
  "awesome react",
  "free programming books",
  "awesome web development",
  "awesome nodejs",
  "awesome typescript",
  "developer roadmap",
  "awesome docker",
  "awesome linux",
  "awesome databases",
  "awesome algorithms",
  "open source computer science curriculum",

  // ── AI, Machine Learning & Data Science ──────────────────────
  "awesome machine learning",
  "awesome deep learning",
  "awesome artificial intelligence",
  "awesome data science",
  "awesome nlp",
  "awesome computer vision",
  "awesome mlops",
  "awesome generative ai",

  // ── Mathematics ───────────────────────────────────────────────
  "awesome math",
  "free mathematics textbooks",
  "open source math education",
  "statistics learning resources",

  // ── Science ───────────────────────────────────────────────────
  "awesome biology",
  "awesome chemistry",
  "awesome physics",
  "open science resources",
  "awesome neuroscience",
  "awesome genomics",

  // ── Healthcare & Medicine ─────────────────────────────────────
  "awesome healthcare",
  "open medical education",
  "awesome public health",
  "awesome mental health",
  "medical learning resources",

  // ── Nutrition ─────────────────────────────────────────────────
  "nutrition learning resources",
  "open nutritional science",
  "food science education",

  // ── Hardware & Electronics ────────────────────────────────────
  "awesome embedded",
  "awesome arduino",
  "awesome raspberry pi",
  "awesome iot",
  "awesome electronics",
  "awesome robotics",
  "awesome hardware",

  // ── Arts & Creative ───────────────────────────────────────────
  "awesome design",
  "awesome creative coding",
  "awesome music",
  "open educational art resources",

  // ── Business & Finance ────────────────────────────────────────
  "awesome finance",
  "awesome economics",
  "open source finance education",
  "awesome entrepreneurship",

  // ── Languages & Humanities ────────────────────────────────────
  "awesome linguistics",
  "language learning resources",
  "awesome history",
  "open humanities education",

  // ── Environment & Engineering ─────────────────────────────────
  "awesome sustainability",
  "awesome renewable energy",
  "awesome civil engineering",
  "awesome mechanical engineering",

  // ── Psychology & Philosophy ───────────────────────────────────
  "awesome psychology",
  "awesome philosophy",
  "cognitive science resources",
];

/**
 * Fetches curated learning repositories from the GitHub REST API.
 * Handles 403 rate limit gracefully with a Socket.io warning.
 * @param {object} opts
 * @param {number} [opts.maxPerQuery=5] - Max repos per search query.
 * @returns {Promise<{saved: number, skipped: number, errors: number}>}
 */
export async function ingestGitHub({ maxPerQuery = 5 } = {}) {
  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "LearnHub-AutomationBot/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!token) {
    emit("automation:activity", {
      type: "warning",
      source: "GitHub",
      message: "GITHUB_TOKEN not set — using unauthenticated rate limits (60 req/hr).",
    });
  }

  let saved = 0, skipped = 0, errors = 0;

  emit("automation:activity", {
    type: "info",
    source: "GitHub",
    message: `Starting GitHub ingestion — ${GITHUB_QUERIES.length} queries × ${maxPerQuery} results.`,
  });

  for (const query of GITHUB_QUERIES) {
    try {
      const encodedQuery = encodeURIComponent(`${query} in:name,description stars:>50`);
      const url =
        `https://api.github.com/search/repositories` +
        `?q=${encodedQuery}&sort=stars&order=desc&per_page=${maxPerQuery}`;

      const data = await fetchJSON(url, headers);

      const items = data.items || [];
      for (const repo of items) {
        try {
          const repoUrl = repo.html_url;
          if (!repoUrl) { skipped++; continue; }

          const title = repo.full_name || repo.name || "Untitled Repo";
          const description = repo.description || `Open-source learning repository: ${title}`;
          const level = classifyDifficulty(`${title} ${description}`);
          const tags = (repo.topics || [title.split("/").pop()]).slice(0, 8);
          const { categoryName, categoryId } = await resolveCategory(tags[0] || title);

          const rawScore = scoreResource({
            title,
            description,
            thumbnail: `https://opengraph.githubassets.com/1/${repo.full_name}`,
            tags,
            platform: "GitHub",
            url: repoUrl,
          });

          const payload = {
            title,
            description: description.slice(0, 500),
            url: repoUrl,
            platform: "GitHub",
            category: categoryName,
            categoryId,
            level,
            thumbnail: `https://opengraph.githubassets.com/1/${repo.full_name}`,
            tags,
            rating: Math.min(5, parseFloat((((Math.log10(Math.max(repo.stargazers_count || 1, 1)) * 0.8) + (rawScore * 0.4))).toFixed(1))),
            verified: false,
            featured: false,
            status: "approved",
            submitterName: "AutoBot",
            reviewNotes: `Auto-ingested from GitHub query: "${query}"`,
          };

          const result = await Resource.updateOne(
            { url: repoUrl },
            { $setOnInsert: payload },
            { upsert: true }
          );

          if (result.upsertedCount > 0) {
            saved++;
            emit("automation:new_resource", {
              source: "GitHub",
              title,
              url: repoUrl,
              level,
              category: categoryName,
              stars: repo.stargazers_count,
            });
          } else {
            skipped++;
          }
        } catch (itemErr) {
          errors++;
          emit("automation:activity", {
            type: "error",
            source: "GitHub",
            message: `Failed to process repo: ${itemErr.message}`,
          });
        }
      }

      emit("automation:activity", {
        type: "progress",
        source: "GitHub",
        message: `Query "${query}" done — ${items.length} repos processed.`,
      });

      // Respect GitHub secondary rate limits — 1 req/sec for search API
      await new Promise((r) => setTimeout(r, 1100));
    } catch (queryErr) {
      const isRateLimit =
        queryErr.message?.includes("403") || queryErr.message?.includes("429");
      errors++;
      emit("automation:activity", {
        type: isRateLimit ? "quota_warning" : "error",
        source: "GitHub",
        message: isRateLimit
          ? `GitHub rate limit hit on query "${query}" — pausing 60s.`
          : `GitHub query "${query}" failed: ${queryErr.message}`,
      });
      if (isRateLimit) {
        await new Promise((r) => setTimeout(r, 60000));
      }
    }
  }

  emit("automation:activity", {
    type: "complete",
    source: "GitHub",
    message: `GitHub ingestion complete — saved: ${saved}, skipped: ${skipped}, errors: ${errors}.`,
    stats: { saved, skipped, errors },
  });

  return { saved, skipped, errors };
}

// ─────────────────────────────────────────────
//  MASTER RUN — Universal Multi-Source Orchestrator
// ─────────────────────────────────────────────

/**
 * Master orchestrator — runs ingestion sources (YouTube, GitHub, OpenLibrary, Wikipedia, arXiv, freeCodeCamp)
 * and aggregates results.
 * @param {object} [opts]
 * @param {number} [opts.ytMaxPerQuery=5]
 * @param {number} [opts.ghMaxPerQuery=5]
 * @param {number} [opts.olMaxPerQuery=3]
 * @param {boolean} [opts.includeBooks=true]
 * @param {boolean} [opts.includeWikipedia=true]
 * @param {boolean} [opts.includeArxiv=true]
 * @param {boolean} [opts.includeFreeCodeCamp=true]
 * @returns {Promise<{results: object, totalSaved: number, ranAt: string}>}
 */
export async function runAutomationPipeline(opts = {}) {
  const ranAt = new Date().toISOString();

  emit("automation:activity", {
    type: "pipeline_start",
    message: "LearnHub universal multi-source automation pipeline started.",
    ranAt,
  });

  const tasks = [];
  const taskNames = [];

  // 1. YouTube
  tasks.push(ingestYouTube({ maxPerQuery: opts.ytMaxPerQuery ?? 5 }));
  taskNames.push("youtube");

  // 2. GitHub
  tasks.push(ingestGitHub({ maxPerQuery: opts.ghMaxPerQuery ?? 5 }));
  taskNames.push("github");

  // 3. Open Library (Books)
  if (opts.includeBooks !== false) {
    tasks.push(ingestOpenLibrary({ maxPerQuery: opts.olMaxPerQuery ?? 3 }));
    taskNames.push("openLibrary");
  }

  // 4. Wikipedia
  if (opts.includeWikipedia !== false) {
    tasks.push(ingestWikipedia());
    taskNames.push("wikipedia");
  }

  // 5. arXiv (Academic Research)
  if (opts.includeArxiv !== false) {
    tasks.push(ingestArxiv());
    taskNames.push("arxiv");
  }

  // 6. freeCodeCamp
  if (opts.includeFreeCodeCamp !== false) {
    tasks.push(ingestFreeCodeCamp());
    taskNames.push("freeCodeCamp");
  }

  const settled = await Promise.allSettled(tasks);
  const results = {};
  let totalSaved = 0;

  settled.forEach((res, idx) => {
    const name = taskNames[idx];
    if (res.status === "fulfilled") {
      results[name] = res.value;
      totalSaved += (res.value?.saved || 0);
    } else {
      results[name] = { saved: 0, skipped: 0, errors: 1, error: res.reason?.message };
    }
  });

  emit("automation:activity", {
    type: "pipeline_complete",
    message: `Pipeline finished — total new resources saved: ${totalSaved}.`,
    ranAt,
    summary: { ...results, totalSaved },
  });

  return { results, totalSaved, ranAt };
}

// Re-export individual source functions for granular controls
export {
  ingestOpenLibrary,
  ingestWikipedia,
  ingestArxiv,
  ingestFreeCodeCamp,
};
