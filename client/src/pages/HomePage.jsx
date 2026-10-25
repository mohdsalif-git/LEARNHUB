import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, ArrowRight, Star, Loader2, AlertCircle,
  BookOpen, Play, Share2, Zap, Users,
  BadgeCheck, Heart, Sparkles, Monitor, Brain, TrendingUp, RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ResourceCard } from "../components/resources/ResourceCard";
import { FeatureCard } from "../components/common/FeatureCard";
import { CategoryCarousel } from "../components/common/CategoryCarousel";
import { resourceService } from "../services/resourceService";
import { feedbackService } from "../services/feedbackService";
import { contentService } from "../services/contentService";
import { categoryService } from "../services/categoryService";
import { Button } from "../components/ui/Button";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/StateComponents";

/* ── Number formatting helper ─────────────────────────────────────────── */
function formatCount(num) {
  if (num === null || num === undefined) return "—";
  if (typeof num !== "number") return String(num);
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(num);
}

/* ── Floating 3D card layout configs ──────────────────────────────────── */
const FLOATING_CARDS = [
  { label: "Watch Free Videos", icon: Play, gradient: "linear-gradient(135deg, #6C4EFF, #4DA3FF)", delay: "0s", anim: "animate-float-slow", top: "10%", right: "2%", rotation: "rotate(4deg)" },
  { label: "Learn New Skills", icon: BookOpen, gradient: "linear-gradient(135deg, #23D5E8, #4DA3FF)", delay: "0.8s", anim: "animate-float-medium", top: "28%", right: "0%", rotation: "rotate(-3deg)" },
  { label: "Build Projects", icon: Monitor, gradient: "linear-gradient(135deg, #FF6B9D, #C44DFF)", delay: "0.4s", anim: "animate-float-fast", top: "50%", right: "3%", rotation: "rotate(5deg)" },
  { label: "Grow Together", icon: TrendingUp, gradient: "linear-gradient(135deg, #4CAF7D, #23D5E8)", delay: "1.2s", anim: "animate-float-slow", top: "68%", right: "1%", rotation: "rotate(-4deg)" },
];

/* ── Scroll reveal hook ───────────────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { el.classList.add("is-visible"); return; }

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("is-visible"); observer.disconnect(); } },
      { threshold: 0.1, rootMargin: "0px 0px -48px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Stat card component ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, gradient, value, label, isLoading }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-6 text-center stat-divider group">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
        style={{ background: gradient }}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col items-center justify-center min-h-[50px]">
        {isLoading ? (
          <Skeleton className="h-8 w-16 rounded-lg my-0.5" />
        ) : (
          <div className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {value}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

/* ── Section header component ─────────────────────────────────────────── */
function SectionHeaderPremium({ eyebrow, title, highlightWord, description, action }) {
  const titleParts = highlightWord ? title.split(highlightWord) : [title];
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-10">
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="h-3 w-3" />
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {highlightWord ? (
            <>
              {titleParts[0]}
              <span className="text-gradient">{highlightWord}</span>
              {titleParts[1]}
            </>
          ) : title}
        </h2>
        {description && <p className="mt-2 text-muted-foreground text-sm sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HOMEPAGE
   ══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [q, setQ] = useState("");
  const [featuredResources, setFeaturedResources] = useState([]);
  const [videoResources, setVideoResources] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState(null);

  const [whyCards, setWhyCards] = useState([]);
  const [howSteps, setHowSteps] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingWhy, setLoadingWhy] = useState(true);
  const [loadingHow, setLoadingHow] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const [featuredError, setFeaturedError] = useState(false);
  const [testimonialsError, setTestimonialsError] = useState(false);
  const [statsError, setStatsError] = useState(false);

  // Scroll reveal refs
  const heroRef = useScrollReveal();
  const statsRef = useScrollReveal();
  const featuresRef = useScrollReveal();
  const featuredRef = useScrollReveal();
  const videosRef = useScrollReveal();
  const howRef = useScrollReveal();
  const feedbackRef = useScrollReveal();
  const ctaRef = useScrollReveal();
  const teamRef = useScrollReveal();

  /* ── 1. Fetch live application statistics ───────────────────────────── */
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError(false);
    try {
      // First attempt: Dedicated public stats endpoint
      const res = await contentService.getPublicStats();
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      } else {
        throw new Error("Invalid stats response");
      }
    } catch {
      // Fallback: Calculate dynamically from public resources and categories
      try {
        const [resourcesRes, categoriesRes] = await Promise.all([
          resourceService.getAll({ limit: 100 }),
          categoryService.getAll({ status: "active" }),
        ]);

        const allResources = resourcesRes.data?.resources || [];
        const totalRes = resourcesRes.data?.total || allResources.length;
        const allCategories = categoriesRes.data?.categories || [];
        const uniquePlatforms = Array.from(new Set(allResources.map((r) => r.platform).filter(Boolean)));

        setStats({
          totalResources: totalRes,
          totalCategories: allCategories.length,
          totalPlatforms: uniquePlatforms.length,
          platforms: uniquePlatforms,
          totalLearners: null, // Truthful fallback: omit or show "—" when user count API unavailable
        });
      } catch {
        setStatsError(true);
      }
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /* ── 2. Fetch live categories ───────────────────────────────────────── */
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await categoryService.getAll({ status: "active" });
      setDbCategories(res.data?.categories || []);
    } catch {
      setDbCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  /* ── 3. Fetch live dynamic content (why, how, team, settings) ────────── */
  const fetchDynamicContent = useCallback(async () => {
    setLoadingWhy(true);
    setLoadingHow(true);
    setLoadingTeam(true);

    try {
      const [whyRes, howRes, teamRes, settingsRes] = await Promise.allSettled([
        contentService.getWhyCards(),
        contentService.getHowSteps(),
        contentService.getTeam(),
        contentService.getPublicSettings(),
      ]);

      if (whyRes.status === "fulfilled" && whyRes.value.data?.cards) {
        setWhyCards(whyRes.value.data.cards);
      }
      if (howRes.status === "fulfilled" && howRes.value.data?.steps) {
        setHowSteps(howRes.value.data.steps);
      }
      if (teamRes.status === "fulfilled" && teamRes.value.data?.members) {
        setTeamMembers(teamRes.value.data.members);
      }
      if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
        setSiteSettings(settingsRes.value.data);
      }
    } finally {
      setLoadingWhy(false);
      setLoadingHow(false);
      setLoadingTeam(false);
    }
  }, []);

  /* ── 4. Fetch live featured resources ────────────────────────────────── */
  const fetchFeatured = useCallback(async () => {
    setLoadingFeatured(true);
    setFeaturedError(false);
    try {
      const res = await resourceService.getAll({ featured: true, limit: 6 });
      setFeaturedResources(res.data?.resources || []);
    } catch {
      setFeaturedError(true);
      setFeaturedResources([]);
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  /* ── 5. Fetch live video resources ───────────────────────────────────── */
  const fetchVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const res = await resourceService.getAll({ platform: "YouTube", limit: 6, sort: "createdAt", order: "desc" });
      setVideoResources(res.data?.resources || []);
    } catch {
      setVideoResources([]);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  /* ── 6. Fetch live community feedback ─────────────────────────────────── */
  const fetchTestimonials = useCallback(async () => {
    setLoadingTestimonials(true);
    setTestimonialsError(false);
    try {
      const res = await feedbackService.getAll();
      const feedbackList = (res.data?.feedback || []).filter(
        (f) => f.status === "published" || !f.status
      );
      setTestimonials(feedbackList.slice(0, 3));
    } catch {
      setTestimonialsError(true);
      setTestimonials([]);
    } finally {
      setLoadingTestimonials(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchDynamicContent();
    fetchFeatured();
    fetchVideos();
    fetchTestimonials();
  }, [fetchStats, fetchCategories, fetchDynamicContent, fetchFeatured, fetchVideos, fetchTestimonials]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const showGuestSections = !authLoading && !user;
  const heroHeading = siteSettings?.heroTitle || "Find the Best Free Learning Resources in One Place";
  const heroDescription = siteSettings?.heroSubtitle || "Search free videos, tutorials and courses from YouTube, Google, freeCodeCamp and more.";

  // Derive popular topics strictly from real active categories in the database
  const popularTopics = dbCategories.slice(0, 6).map((c) => c.name);
  const heroPillTags = dbCategories.slice(0, 4).map((c) => c.name);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-x-clip hero-bg"
        aria-labelledby="hero-heading"
      >
        {/* Subtle grid texture */}
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />

        {/* Atmospheric glow blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 right-[15%] h-96 w-96 rounded-full blur-3xl opacity-30"
            style={{ background: "radial-gradient(circle, hsl(258 90% 70% / 0.4), transparent 70%)" }} />
          <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, hsl(192 95% 60% / 0.5), transparent 70%)" }} />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, hsl(270 80% 70% / 0.4), transparent 70%)" }} />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-center min-h-svh pt-28 pb-16 lg:pb-24">

            {/* ── LEFT: Content ─────────────────────────────────────────── */}
            <div ref={heroRef} className="reveal-on-scroll max-w-2xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary shadow-sm mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                One Search. All Knowledge. Zero Cost.
              </div>

              {/* Heading */}
              <h1
                id="hero-heading"
                className="text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {heroHeading.includes("Free Learning") ? (
                  <>
                    Find the Best{" "}
                    <span className="text-gradient">Free Learning</span>
                    <br />Resources in One Place
                  </>
                ) : heroHeading}
              </h1>

              {/* Subheading */}
              <p className="mt-5 text-base text-muted-foreground sm:text-lg leading-relaxed max-w-xl">
                {heroDescription}
              </p>

              {/* Search bar */}
              <form
                onSubmit={handleSearch}
                className="mt-8 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-[var(--shadow-elevated)] search-glow max-w-xl transition-all duration-200"
                role="search"
              >
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search live resources by topic, tech, or skill…"
                  aria-label="Search free learning resources"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  id="hero-search"
                />
                <Button
                  type="submit"
                  className="rounded-xl px-5 py-2 text-sm font-semibold text-white shrink-0 btn-glow"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  Search →
                </Button>
              </form>

              {/* Real popular topics from active categories */}
              {popularTopics.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Topics:</span>
                  {popularTopics.map((topic) => (
                    <Link
                      key={topic}
                      to={`/search?q=${encodeURIComponent(topic)}`}
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary shadow-[var(--shadow-xs)]"
                    >
                      {topic}
                    </Link>
                  ))}
                </div>
              )}

              {/* Trust signals */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  to="/categories"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md btn-glow transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  Start Learning <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/share"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-xs)] hover:bg-muted/60 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Share2 className="h-4 w-4 text-primary" /> Share a Resource
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5 text-success" /> 100% Free Forever
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Community Curated
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-destructive" /> Beginner Friendly
                </span>
              </div>
            </div>

            {/* ── RIGHT: Floating 3D visual ─────────────────────────────── */}
            <div
              className="relative hidden lg:block"
              style={{ height: "480px", perspective: "1000px" }}
              aria-hidden="true"
            >
              {/* Centered decorative glow */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-3xl opacity-30"
                style={{ background: "radial-gradient(circle, hsl(258 90% 60% / 0.5), hsl(192 95% 48% / 0.3))" }}
              />

              {/* Central real-data panel */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-52 w-52 rounded-3xl shadow-[var(--shadow-float)]"
                style={{
                  background: "linear-gradient(135deg, hsl(258 90% 60% / 0.12), hsl(192 95% 48% / 0.08))",
                  border: "1px solid hsl(258 90% 60% / 0.15)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ background: "var(--gradient-hero)" }}
                  >
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                    Learn Anything
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {loadingStats ? (
                      <span className="inline-block h-3.5 w-20 rounded bg-muted/60 animate-pulse" />
                    ) : (
                      `${formatCount(stats?.totalResources || 0)} free resource${stats?.totalResources === 1 ? "" : "s"}`
                    )}
                  </p>
                </div>
              </div>

              {/* Floating cards */}
              {FLOATING_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`absolute glass rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[var(--shadow-float)] ${card.anim}`}
                    style={{
                      top: card.top,
                      right: card.right,
                      transform: card.rotation,
                      animationDelay: card.delay,
                      minWidth: "160px",
                    }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                      style={{ background: card.gradient }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground whitespace-nowrap">{card.label}</span>
                  </div>
                );
              })}

              {/* Tag pills floating on the left (strictly derived from real categories) */}
              {heroPillTags.map((tag, i) => (
                <div
                  key={tag}
                  className="absolute left-0 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-xs font-medium text-primary shadow-sm animate-float-slow backdrop-blur-sm"
                  style={{
                    top: `${20 + i * 20}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${5 + i * 0.8}s`,
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          LIVE STATISTICS SECTION (100% Real Application Data)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-6 bg-card border-y border-border" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Platform statistics</h2>
        <div ref={statsRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {statsError ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-sm text-muted-foreground">Unable to load statistics.</p>
              <Button variant="outline" size="sm" onClick={fetchStats} className="mt-3 gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : (
            <div className="glass-strong rounded-2xl shadow-[var(--shadow-glass)] overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" role="list" aria-label="Platform statistics">
                {/* 1. Free Resources (Real count from DB) */}
                <StatCard
                  icon={BookOpen}
                  gradient="linear-gradient(135deg, #6C4EFF, #4DA3FF)"
                  value={stats ? formatCount(stats.totalResources) : "0"}
                  label="Free Resources"
                  isLoading={loadingStats}
                />

                {/* 2. Learning Categories (Real active categories count) */}
                <StatCard
                  icon={Brain}
                  gradient="linear-gradient(135deg, #23D5E8, #4DA3FF)"
                  value={stats ? formatCount(stats.totalCategories) : "0"}
                  label="Learning Categories"
                  isLoading={loadingStats}
                />

                {/* 3. Content Platforms (Unique platforms represented in real resources) */}
                <StatCard
                  icon={Monitor}
                  gradient="linear-gradient(135deg, #FF6B9D, #C44DFF)"
                  value={stats ? formatCount(stats.totalPlatforms) : "0"}
                  label="Content Platforms"
                  isLoading={loadingStats}
                />

                {/* 4. No Paywalls Policy */}
                <StatCard
                  icon={Zap}
                  gradient="linear-gradient(135deg, #4CAF7D, #23D5E8)"
                  value="100% Free"
                  label="No Paywalls"
                  isLoading={false}
                />

                {/* 5. Registered Learners (Real registered users count from DB) */}
                <StatCard
                  icon={Users}
                  gradient="linear-gradient(135deg, #FF9800, #FF5722)"
                  value={stats ? (stats.totalLearners !== null ? formatCount(stats.totalLearners) : "—") : "—"}
                  label="Registered Learners"
                  isLoading={loadingStats}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          WHY WINGLY — Features (Real content from DB, guest only)
          ══════════════════════════════════════════════════════════════════ */}
      {showGuestSections && (
        <section className="py-16 sm:py-24 overflow-hidden bg-background" aria-labelledby="value-heading">
          <div ref={featuresRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
            <SectionHeaderPremium
              eyebrow="WHY WINGLY"
              title="Everything you need to learn "
              highlightWord="anything"
              description="Curated high-quality free resources from top platforms, organized by topic and skill level."
              action={
                <Link to="/categories" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group">
                  View All Categories <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              }
            />
          </div>

          {loadingWhy ? (
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-muted/50 animate-pulse border border-border/50" />
                ))}
              </div>
            </div>
          ) : whyCards.length > 0 ? (
            <div className="overflow-hidden w-full" aria-label="Why Wingly features">
              <div className="marquee-track flex gap-5 pl-4 py-2">
                {whyCards.map((item, index) => (
                  <FeatureCard key={item._id || item.title || index} icon={item.icon} title={item.title} description={item.description} />
                ))}
                {whyCards.map((item, index) => (
                  <FeatureCard key={`clone-${item._id || item.title || index}`} icon={item.icon} title={item.title} description={item.description} aria-hidden="true" tabIndex={-1} />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          FEATURED RESOURCES (Real approved resources with featured=true)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-background" aria-labelledby="featured-heading">
        <div ref={featuredRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeaderPremium
            eyebrow="FEATURED CONTENT"
            title="Hand-picked "
            highlightWord="free resources"
            description="Curated by our community • Hand-reviewed • Updated regularly"
            action={
              <Link to="/search?featured=true" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group">
                View Featured <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />

          {loadingFeatured ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading featured resources">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredError ? (
            <div className="glass rounded-2xl p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Failed to load resources</h3>
              <p className="mt-1 text-sm text-muted-foreground">Please try again later.</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={fetchFeatured}>
                <RefreshCw className="h-4 w-4" /> Retry
              </Button>
            </div>
          ) : featuredResources.length === 0 ? (
            <EmptyState
              type="resources"
              title="No featured resources yet"
              description="Browse our complete catalog or submit a recommended free resource."
              action={{ label: "Browse all resources", variant: "primary", href: "/search" }}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredResources.map((r) => <ResourceCard key={r._id} resource={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CATEGORY CAROUSEL (Real categories from database)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-background">
        {loadingCategories ? (
          <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                {[1, 2, 3, 4].map((i) => <Skeleton className="h-20 rounded-2xl" key={i} />)}
              </div>
            </div>
          </div>
        ) : dbCategories.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              type="categories"
              title="No categories available yet"
              description="Categories will appear once added by administrators."
            />
          </div>
        ) : (
          <CategoryCarousel categories={dbCategories} />
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          VIDEO LEARNING (Real video resources from database)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-background" aria-labelledby="videos-heading">
        <div ref={videosRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeaderPremium
            eyebrow="VIDEO LEARNING"
            title="Free video tutorials from "
            highlightWord="top creators"
            description="Curated educational videos and tutorials organized for structured learning."
            action={
              <Link to="/search?platform=YouTube" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group">
                Explore all videos <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />

          {loadingVideos ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading video resources">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : videoResources.length === 0 ? (
            <EmptyState
              type="resources"
              title="No video resources yet"
              description="Discover tutorials and courses across all platforms in our catalog."
              action={{ label: "Browse all resources", variant: "primary", href: "/search" }}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videoResources.map((r) => <ResourceCard key={r._id} resource={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          HOW IT WORKS (Real steps from DB, guest only)
          ══════════════════════════════════════════════════════════════════ */}
      {showGuestSections && (
        <section className="py-16 sm:py-24 bg-background" aria-labelledby="how-heading">
          <div ref={howRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeaderPremium
              eyebrow="GETTING STARTED"
              title="Start learning in "
              highlightWord="simple steps"
              description="No complex setup, no paywalls — just find and learn."
            />

            {loadingHow ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse border border-border" />
                ))}
              </div>
            ) : howSteps.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {howSteps.map((step, index) => (
                  <article
                    key={step._id || index}
                    className="group relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-float)] hover:border-primary/30 transition-all duration-300"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-white font-bold text-sm shadow-md mb-4 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: "var(--gradient-hero)" }}
                    >
                      {step.number || `0${index + 1}`}
                    </div>
                    <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    {index < howSteps.length - 1 && (
                      <div className="absolute top-10 -right-3 hidden h-0.5 w-6 bg-gradient-to-r from-primary/40 to-transparent lg:block" aria-hidden="true" />
                    )}
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          COMMUNITY FEEDBACK (Real learner reviews from database)
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-background" aria-labelledby="feedback-heading">
        <div ref={feedbackRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeaderPremium
            eyebrow="COMMUNITY REVIEWS"
            title="What learners are "
            highlightWord="saying"
            description="Real feedback from registered learners using Wingly."
            action={
              <Link to="/feedback" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group">
                View all feedback <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            }
          />

          {loadingTestimonials ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading testimonials">
              {[1, 2, 3].map((i) => <Skeleton className="h-40 rounded-2xl bg-muted/60" key={i} />)}
            </div>
          ) : testimonialsError ? (
            <div className="glass rounded-2xl p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Failed to load feedback</h3>
              <p className="mt-1 text-sm text-muted-foreground">Please try again later.</p>
              <Button variant="outline" className="mt-4 gap-2" size="sm" onClick={fetchTestimonials}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((f) => (
                <article
                  key={f._id}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-200"
                >
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: f.rating || 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                  <blockquote className="text-sm text-foreground leading-relaxed">
                    &ldquo;{f.message}&rdquo;
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                      style={{ background: "var(--gradient-hero)" }}
                    >
                      {(f.name || "W").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{f.name || "Anonymous Learner"}</p>
                      <p className="text-xs text-muted-foreground">Wingly Community</p>
                    </div>
                  </figcaption>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              type="feedback"
              title="No feedback published yet"
              description="Be the first to share your learning experience on Wingly."
              action={{ label: "Share Feedback", variant: "primary", href: "/feedback" }}
            />
          )}

          <div className="mt-8 text-center">
            <Link
              to="/feedback"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-[var(--shadow-xs)] hover:bg-muted/40 hover:-translate-y-0.5 transition-all duration-200"
            >
              Share Your Feedback <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CTA SECTION
          ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 bg-background" aria-labelledby="cta-heading">
        <div ref={ctaRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-white shadow-[var(--shadow-float)]"
            style={{ background: "var(--gradient-hero)" }}
          >
            <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" aria-hidden="true" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto] max-w-4xl mx-auto text-center lg:text-left">
              <div>
                <h2 id="cta-heading" className="text-2xl font-bold sm:text-3xl lg:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                  Ready to start learning?
                </h2>
                <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base lg:text-lg">
                  Explore thousands of free educational courses and tutorials.
                  No paywalls, no subscriptions — zero cost.
                </p>
              </div>
              <Link
                to="/categories"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold shadow-lg hover:bg-white/90 hover:-translate-y-0.5 transition-all duration-200 shrink-0"
                style={{ color: "hsl(var(--primary))" }}
              >
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TEAM SECTION (Real team from database)
          ══════════════════════════════════════════════════════════════════ */}
      {teamMembers.length > 0 && (
        <section className="py-16 sm:py-24 bg-background" aria-labelledby="team-heading">
          <div ref={teamRef} className="reveal-on-scroll mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeaderPremium
              eyebrow="OUR TEAM"
              title="Meet the people "
              highlightWord="behind Wingly"
              description="Dedicated contributors working to keep high-quality education accessible to all."
              action={
                <Link to="/team" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group">
                  View Team <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {teamMembers.map((m) => {
                const initials = m.initials || m.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "LH";
                return (
                  <article
                    key={m._id || m.name}
                    className="group rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)] hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] hover:border-primary/20 transition-all duration-300"
                  >
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} className="mx-auto h-16 w-16 rounded-full object-cover border-2 border-primary/20 shadow-md group-hover:shadow-[var(--shadow-glow-primary)] transition-shadow duration-300" />
                    ) : (
                      <div
                        className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-white shadow-md group-hover:shadow-[var(--shadow-glow-primary)] transition-shadow duration-300"
                        style={{ background: "var(--gradient-hero)" }}
                      >
                        {initials}
                      </div>
                    )}
                    <h3 className="mt-3 text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>{m.name}</h3>
                    <p className="text-xs font-medium mt-0.5 text-gradient">{m.role}</p>
                    {m.bio && <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{m.bio}</p>}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}