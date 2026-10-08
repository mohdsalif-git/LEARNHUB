import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  Share2,
  Sparkles,
  BadgeCheck,
  Users,
  Heart,
  Star,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ResourceCard } from "../components/resources/ResourceCard";
import { SectionHeader } from "../components/common/SectionHeader";
import { FeatureCard } from "../components/common/FeatureCard";
import { CategoryCarousel } from "../components/common/CategoryCarousel";
import { categories as defaultCategories, popularTags, team as defaultTeam } from "../lib/data";
import { resourceService } from "../services/resourceService";
import { feedbackService } from "../services/feedbackService";
import { contentService } from "../services/contentService";
import { categoryService } from "../services/categoryService";
import { Button } from "../components/ui/Button";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/StateComponents";

const DEFAULT_WHY_CARDS = [
  { icon: "search", title: "Discover Resources", description: "Find free videos, tutorials, and courses from trusted platforms — all in one search." },
  { icon: "play", title: "Video Learning", description: "Access curated YouTube, freeCodeCamp, and educational videos organized by topic." },
  { icon: "book-open", title: "Organized by Topic", description: "Browse structured learning paths across web development, data science, design, and more." },
  { icon: "share2", title: "Share Knowledge", description: "Contribute resources you find useful and help the community grow." },
  { icon: "message-square", title: "Community Feedback", description: "Read real learner reviews and share your own experience to help others." },
  { icon: "zap", title: "Always Free", description: "No paywalls, no subscriptions. Just free learning resources, forever." },
];

const DEFAULT_HOW_STEPS = [
  { number: "01", title: "Search or Browse", description: "Find what you want to learn by searching or exploring categories." },
  { number: "02", title: "Choose a Resource", description: "Pick from curated free videos, tutorials, and courses." },
  { number: "03", title: "Start Learning", description: "Open the resource directly on the original platform — no login required." },
  { number: "04", title: "Save & Share", description: "Bookmark resources and share great finds with the community." },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [q, setQ] = useState("");
  const [featuredResources, setFeaturedResources] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [videoResources, setVideoResources] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState(null);

  // Dynamic content from API
  const [whyCards, setWhyCards] = useState(DEFAULT_WHY_CARDS);
  const [howSteps, setHowSteps] = useState(DEFAULT_HOW_STEPS);
  const [teamMembers, setTeamMembers] = useState(defaultTeam);
  const [dbCategories, setDbCategories] = useState(defaultCategories);
  const [siteSettings, setSiteSettings] = useState(null);

  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);
  const [testimonialsError, setTestimonialsError] = useState(false);

  // Fetch Site Content from DB
  useEffect(() => {
    async function loadDynamicContent() {
      try {
        const [whyRes, howRes, teamRes, catRes, settingsRes] = await Promise.allSettled([
          contentService.getWhyCards(),
          contentService.getHowSteps(),
          contentService.getTeam(),
          categoryService.getAll({ status: "active" }),
          contentService.getPublicSettings(),
        ]);

        if (whyRes.status === "fulfilled" && whyRes.value.data?.cards?.length > 0) {
          setWhyCards(whyRes.value.data.cards);
        }
        if (howRes.status === "fulfilled" && howRes.value.data?.steps?.length > 0) {
          setHowSteps(howRes.value.data.steps);
        }
        if (teamRes.status === "fulfilled" && teamRes.value.data?.members?.length > 0) {
          setTeamMembers(teamRes.value.data.members);
        }
        if (catRes.status === "fulfilled" && catRes.value.data?.categories?.length > 0) {
          setDbCategories(catRes.value.data.categories);
        }
        if (settingsRes.status === "fulfilled" && settingsRes.value.data) {
          setSiteSettings(settingsRes.value.data);
        }
      } catch {
        // Fallbacks already in place
      }
    }
    loadDynamicContent();
  }, []);

  const fetchFeatured = useCallback(async () => {
    setLoadingFeatured(true);
    setFeaturedError(false);
    try {
      const res = await resourceService.getAll({ featured: true, limit: 6 });
      setFeaturedResources(res.data?.resources || []);
    } catch {
      setFeaturedError(true);
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const res = await resourceService.getAll({ limit: 6, sort: "createdAt", order: "desc" });
      setRecentResources(res.data?.resources || []);
    } catch {
      setRecentResources([]);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

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

  const fetchTestimonials = useCallback(async () => {
    setLoadingTestimonials(true);
    setTestimonialsError(false);
    try {
      const res = await feedbackService.getAll();
      setTestimonials(res.data?.feedback?.slice(0, 3) || []);
    } catch {
      setTestimonialsError(true);
    } finally {
      setLoadingTestimonials(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await resourceService.getAll({ limit: 1 });
      setStats({ totalResources: res.data?.total || 0 });
    } catch {
      setStats({ totalResources: 0 });
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
    fetchRecent();
    fetchVideos();
    fetchTestimonials();
    fetchStats();
  }, [fetchFeatured, fetchRecent, fetchVideos, fetchTestimonials, fetchStats]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const retryFetch = (type) => {
    if (type === "featured") fetchFeatured();
    if (type === "testimonials") fetchTestimonials();
  };

  // Only show guest sections (Why LearnHub, How It Works) when logged out AND not loading auth
  const showGuestSections = !authLoading && !user;

  // The CSS marquee-scroll animation runs from translateX(0) to translateX(-50%).
  // The track must contain exactly 2 copies so -50% lands back at the seam point.

  const heroHeading = siteSettings?.heroTitle || "Find the Best Free Learning Resources in One Place";
  const heroDescription = siteSettings?.heroSubtitle || "Search free videos, tutorials and courses from YouTube, Edureka, Google, freeCodeCamp and more — organized for faster learning.";

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-soft)" }} aria-labelledby="hero-heading">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: "var(--gradient-hero)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 left-[-10%] h-[360px] w-[360px] rounded-full opacity-15 blur-3xl" style={{ background: "linear-gradient(135deg, var(--secondary), var(--primary-glow))" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-[var(--shadow-card)]">
              <Sparkles className="h-3.5 w-3.5" /> One Search. All Knowledge. Zero Cost.
            </span>
            <h1 id="hero-heading" className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {heroHeading.includes("Free Learning") ? (
                <>
                  Find the Best <span className="text-gradient">Free Learning</span> Resources in One Place
                </>
              ) : (
                heroHeading
              )}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              {heroDescription}
            </p>

            <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-background p-2 shadow-[var(--shadow-elevated)]" role="search">
              <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try 'React', 'Python', 'System Design'…"
                aria-label="Search free learning resources"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="lg" className="rounded-full">
                Search
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Popular:</span>
              {popularTags.map((t) => (
                <Link
                  key={t}
                  to={`/search?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {t}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/categories" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-primary transition-colors">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/share" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                <Share2 className="h-4 w-4" /> Share a Resource
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Free resources. Community powered. Curated for learners.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-[color:var(--success)]" /> 100% Free Forever</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> Community Curated</span>
              <span className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-destructive" /> Beginner Friendly</span>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="border-y border-border bg-muted/30 py-12" aria-labelledby="stats-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 text-center" role="list" aria-label="Platform statistics">
            <div role="listitem" className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-foreground" aria-label="Total resources">
                {loadingStats ? <Skeleton className="h-8 w-24 mx-auto" /> : (stats?.totalResources || 0).toLocaleString()}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Free Resources</p>
            </div>
            <div role="listitem" className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-foreground" aria-label="Categories">
                {dbCategories.length}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Learning Categories</p>
            </div>
            <div role="listitem" className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-foreground" aria-label="Platforms">
                9
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Content Platforms</p>
            </div>
            <div role="listitem" className="p-4">
              <div className="text-3xl sm:text-4xl font-bold text-foreground" aria-label="Free">
                <span className="text-[color:var(--success)]">100%</span> Free
              </div>
              <p className="mt-1 text-sm text-muted-foreground">No Paywalls</p>
            </div>
          </div>
        </div>
      </section>

      {/* Task 4 & 5: Platform Value / "Why LearnHub" (Shown ONLY to logged-out visitors with continuous marquee scrolling) */}
      {showGuestSections && (
        <section className="py-16 sm:py-24 overflow-hidden" aria-labelledby="value-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
            <SectionHeader
              id="value-heading"
              eyebrow="WHY LEARNHUB"
              title="Everything you need to learn anything"
              description="A unified platform that makes discovering free educational content simple, fast, and enjoyable."
            />
          </div>

          {/*
            overflow:hidden masks the aria-hidden clone set so it is never
            visible as a separate row. The CSS marquee-track animation loops
            from 0 → -50%, hitting the seam exactly where the clone begins.
          */}
          <div
            className="overflow-hidden w-full"
            aria-label="Why LearnHub scrolling marquee"
          >
            <div className="marquee-track flex gap-5 pl-4 py-2">
              {/* Visible originals */}
              {whyCards.map((item, index) => (
                <FeatureCard
                  key={item._id || item.title || index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              ))}
              {/* Clone set for seamless loop — hidden from assistive tech */}
              {whyCards.map((item, index) => (
                <FeatureCard
                  key={`clone-${item._id || item.title || index}`}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  aria-hidden="true"
                  tabIndex={-1}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Resources */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="featured-heading"
            eyebrow="FEATURED PICKS"
            title="Hand-picked free resources"
            description="Curated by our team — these are the best free resources available right now."
            action={<Link to="/search?featured=true" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">View all featured <ArrowRight className="h-4 w-4" /></Link>}
          />
          {loadingFeatured ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading featured resources">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredError ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Failed to load resources</h3>
              <p className="mt-1 text-sm text-muted-foreground">Please try again later.</p>
              <Button variant="outline" className="mt-4" onClick={() => retryFetch("featured")}>
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          ) : featuredResources.length === 0 ? (
            <EmptyState type="resources" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredResources.map((r) => <ResourceCard key={r._id} resource={r} />)}
            </div>
          )}
        </div>
      </section>

      {/* Task 6 & 7: Two-Row Scrolling Category Carousel */}
      <CategoryCarousel categories={dbCategories} />

      {/* Video Learning */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="videos-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="videos-heading"
            eyebrow="VIDEO LEARNING"
            title="Free video tutorials from top creators"
            description="Curated YouTube channels and educational videos organized for structured learning."
            action={<Link to="/search?platform=YouTube" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">Explore all videos <ArrowRight className="h-4 w-4" /></Link>}
          />
          {loadingVideos ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading video resources">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : videoResources.length === 0 ? (
            <EmptyState type="resources" action={{ label: "Browse all resources", variant: "primary", href: "/search" }} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {videoResources.map((r) => (
                <ResourceCard key={r._id} resource={r} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Task 4: How It Works (Shown ONLY to logged-out visitors) */}
      {showGuestSections && (
        <section className="py-16 sm:py-24" aria-labelledby="how-heading">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              id="how-heading"
              eyebrow="GETTING STARTED"
              title="Start learning in four simple steps"
              description="No complex setup, no paywalls — just find and learn."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howSteps.map((step, index) => (
                <article
                  key={step._id || index}
                  className="relative p-6 rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all duration-200"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-base border border-primary/20">
                    {step.number || `0${index + 1}`}
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Feedback */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="feedback-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="feedback-heading"
            eyebrow="COMMUNITY REVIEWS"
            title="What learners are saying"
            description="Real feedback from real learners using LearnHub."
            action={<Link to="/feedback" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">View all feedback <ArrowRight className="h-4 w-4" /></Link>}
          />
          {loadingTestimonials ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading testimonials">
              {[1, 2, 3].map((i) => <Skeleton className="h-32 rounded-xl bg-muted/60" key={i} />)}
            </div>
          ) : testimonialsError ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Failed to load testimonials</h3>
              <p className="mt-1 text-sm text-muted-foreground">Please try again later.</p>
              <Button variant="outline" className="mt-4" size="sm" onClick={() => retryFetch("testimonials")}>
                Retry
              </Button>
            </div>
          ) : testimonials.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((f) => (
                <article key={f._id} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <blockquote className="text-sm text-foreground leading-relaxed">&ldquo;{f.message}&rdquo;</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{f.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {Array.from({ length: f.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current text-[color:var(--warning)]" />
                        ))}
                      </p>
                    </div>
                  </figcaption>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState type="feedback" />
          )}
          <div className="mt-8 text-center">
            <Link to="/feedback" className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              View All Feedback <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24" aria-labelledby="cta-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-foreground shadow-xl" style={{ background: "var(--gradient-hero)" }}>
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] max-w-4xl mx-auto text-center lg:text-left">
              <div>
                <h2 id="cta-heading" className="text-2xl font-bold sm:text-3xl lg:text-4xl">Ready to start learning?</h2>
                <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base lg:text-lg">
                  Join thousands of learners discovering free educational content every day. No paywalls, no subscriptions — just quality free resources.
                </p>
              </div>
              <Link to="/categories" className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-8 py-3 text-sm font-semibold text-primary hover:bg-background/90 transition-colors shadow-md">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="team-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="team-heading"
            eyebrow="OUR TEAM"
            title="Meet the people behind LearnHub"
            description="Dedicated contributors working to keep high-quality education accessible to all."
            action={<Link to="/team" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">View team <ArrowRight className="h-4 w-4" /></Link>}
          />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {teamMembers.map((m) => {
              const initials =
                m.initials ||
                m.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() ||
                "LH";
              const color = m.color || "oklch(0.55 0.22 285)";

              return (
                <article key={m._id || m.name} className="rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)] hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all duration-200">
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.name}
                      className="mx-auto h-16 w-16 rounded-full object-cover border border-border shadow-xs"
                    />
                  ) : (
                    <div
                      className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-primary-foreground shadow-xs"
                      style={{ background: `linear-gradient(135deg, ${color}, var(--primary-glow))` }}
                    >
                      {initials}
                    </div>
                  )}
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{m.name}</h3>
                  <p className="text-xs text-primary font-medium mt-0.5">{m.role}</p>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{m.bio}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}