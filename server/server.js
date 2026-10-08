import dotenv from "dotenv";
dotenv.config();
import dns from 'dns';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorMiddleware.js";
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // Ignore in environments where setting custom DNS servers is restricted
}
import authRoutes from "./routes/authRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminResourceRoutes from "./routes/adminResourceRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import Setting from "./models/Setting.js";
import { seedContentDefaults } from "./seed/seedContentDefaults.js";

const app = express();

// Trust proxy for reverse proxies (Vercel, Render, Nginx) so rate limiter and IPs work correctly
app.set("trust proxy", 1);

// Security headers — allow OAuth & payment popups to communicate window status cleanly
// Note: contentSecurityPolicy is disabled on the API backend as it is a JSON REST API;
// document-level CSP is enforced on the frontend hosting layer without unsafe-eval.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Rate limiting - 1000 requests per 15 min for general API browsing
// Skip rate limiting entirely for localhost in development so HMR, React Strict Mode
// double-invocation, and manual testing never hit the cap.
const isLocalhost = (ip) =>
  ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== "production" && isLocalhost(req.ip),
  message: { success: false, message: "Too many requests from this IP, please try again after 15 minutes" },
});
app.use(limiter);

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "https://learnhub-woad.vercel.app",
  "https://learnhub-backend-eight.vercel.app",
  process.env.CLIENT_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      process.env.NODE_ENV !== "production";

    if (isAllowed) {
      callback(null, origin); // Echo the exact origin (required with credentials:true)
    } else {
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}));

// Handle preflight OPTIONS requests explicitly
app.options("*", cors());

// Prevent browser/CDN 304 CORS header mismatches on API routes
app.use((req, res, next) => {
  res.set("Vary", "Origin");
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(
  express.json({
    limit: "10kb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "LearnHub API is running" });
});

// Ensure database is connected before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Rate-limited routes
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/saved-resources", bookmarkRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/feedback", feedbackRoutes);

const handlePublicSettings = async (req, res) => {
  try {
    const settings = await Setting.getSettings();
    res.json({
      success: true,
      data: {
        platformName: settings.platformName,
        platformDescription: settings.platformDescription,
        supportEmail: settings.supportEmail,
        buyMeACoffeeUrl: settings.buyMeACoffeeUrl,
        allowUserSubmissions: settings.allowUserSubmissions,
        logo: settings.logo,
        heroTitle: settings.heroTitle,
        heroSubtitle: settings.heroSubtitle,
        footerText: settings.footerText,
        contactEmail: settings.contactEmail,
        socialLinks: settings.socialLinks,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

app.get("/api/settings/public", handlePublicSettings);
app.get("/api/public/settings", handlePublicSettings);

// Public team endpoint (no auth needed)
app.get("/api/public/team", async (req, res) => {
  try {
    const TeamMember = (await import("./models/TeamMember.js")).default;
    const members = await TeamMember.find({ isActive: true }).sort({ displayOrder: 1 }).select("-__v");
    res.json({ success: true, data: { members } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public why-cards endpoint (no auth needed)
app.get("/api/public/why-cards", async (req, res) => {
  try {
    const WhyCard = (await import("./models/WhyCard.js")).default;
    const cards = await WhyCard.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 }).select("-__v");
    res.json({ success: true, data: { cards } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Public how-steps endpoint (no auth needed)
app.get("/api/public/how-steps", async (req, res) => {
  try {
    const HowStep = (await import("./models/HowStep.js")).default;
    const steps = await HowStep.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 }).select("-__v");
    res.json({ success: true, data: { steps } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Admin routes with stricter rate limiting
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => process.env.NODE_ENV !== "production" && isLocalhost(req.ip),
  message: { success: false, message: "Admin too many requests, please try again after 15 minutes" },
});
app.use("/api/admin", adminLimiter);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminResourceRoutes);

// Catch-all 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  (async () => {
    await connectDB();
    // Seed default content if collections are empty
    await seedContentDefaults();
    const server = app.listen(PORT, () => {
      console.log(`LearnHub server running on port ${PORT}`);
    });

    const shutdown = () => {
      server.close(() => {
        process.exit(0);
      });
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`[Error] Port ${PORT} is already in use. Another instance of the server is running.`);
        process.exit(1);
      } else {
        console.error("Server error:", err);
      }
    });
  })();
}

export default app;

