import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Share2, Coffee, Sparkles, BadgeCheck, Users, Heart, Star, Loader2, AlertCircle, Play, BookOpen, Zap, Globe, Shield, MessageSquare, TrendingUp } from "lucide-react";
import { ResourceCard } from "../components/resources/ResourceCard";
import { SectionHeader } from "../components/common/SectionHeader";
import { CategoryIcon } from "../components/common/CategoryIcon";
import { categories, popularTags, team } from "../lib/data";
import { resourceService } from "../services/resourceService";
import { feedbackService } from "../services/feedbackService";
import { Button } from "../components/ui/Button";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";
import { EmptyState } from "../components/ui/StateComponents";

export default function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [featuredResources, setFeaturedResources] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [videoResources, setVideoResources] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [featuredError, setFeaturedError] = useState(false);
  const [testimonialsError, setTestimonialsError] = useState(false);

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
      // We'll get total count from the response
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

  const platformValueItems = [
    {
      icon: Search,
      title: "Discover Resources",
      description: "Find free videos, tutorials, and courses from trusted platforms — all in one search.",
    },
    {
      icon: Play,
      title: "Video Learning",
      description: "Access curated YouTube, freeCodeCamp, and educational videos organized by topic.",
    },
    {
      icon: BookOpen,
      title: "Organized by Topic",
      description: "Browse structured learning paths across web development, data science, design, and more.",
    },
    {
      icon: Share2,
      title: "Share Knowledge",
      description: "Contribute resources you find useful and help the community grow.",
    },
    {
      icon: MessageSquare,
      title: "Community Feedback",
      description: "Read real learner reviews and share your own experience to help others.",
    },
    {
      icon: Zap,
      title: "Always Free",
      description: "No paywalls, no subscriptions. Just free learning resources, forever.",
    },
  ];

  const howItWorksSteps = [
    { number: "01", title: "Search or Browse", description: "Find what you want to learn by searching or exploring categories." },
    { number: "02", title: "Choose a Resource", description: "Pick from curated free videos, tutorials, and courses." },
    { number: "03", title: "Start Learning", description: "Open the resource directly on the original platform — no login required." },
    { number: "04", title: "Save & Share", description: "Bookmark resources and share great finds with the community." },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-soft)" }} aria-labelledby="hero-heading">
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full opacity-20 blur-3xl" style={{ background: "var(--gradient-hero)" }} aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 left-[-10%] h-[360px] w-[360px] rounded-full opacity-15 blur-3xl" style={{ background: "linear-gradient(135deg, var(--secondary), var(--primary-glow))" }} aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-primary shadow-[var(--shadow-card)]">
              <Sparkles className="h-3.5 w-3.5" /> One Search. All Knowledge. Zero Cost.
            </span>
            <h1 id="hero-heading" className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Find the Best <span className="text-gradient">Free Learning</span> Resources in One Place
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Search free videos, tutorials and courses from YouTube, Edureka, Google, freeCodeCamp and more — organized for faster learning.
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
                {categories.length}
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

      {/* Platform Value */}
      <section className="py-16 sm:py-24" aria-labelledby="value-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="value-heading"
            eyebrow="Why LearnHub"
            title="Everything you need to learn anything"
            description="A unified platform that makes discovering free educational content simple, fast, and enjoyable."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {platformValueItems.map((item, index) => (
              <article key={index} className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] transition-all duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl text-primary group-hover:bg-primary/10 transition-colors">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="featured-heading"
            eyebrow="Featured"
            title="Hand-picked free resources"
            description="Curated by our team — these are the best free resources available right now."
            action={<Link to="/search?featured=true" className="text-sm font-semibold text-primary hover:underline">View all featured &rarr;</Link>}
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

      {/* Resource Discovery */}
      <section className="py-16 sm:py-24" aria-labelledby="categories-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="categories-heading"
            eyebrow="Browse by Topic"
            title="Learn by category"
            description="Curated free resources organized by topic — pick a track and dive in."
            action={<Link to="/categories" className="text-sm font-semibold text-primary hover:underline">View all categories &rarr;</Link>}
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.slice(0, 15).map((c) => (
              <Link
                key={c.slug}
                to={`/categories/${c.slug}`}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}>
                  <CategoryIcon icon={c.icon} sizePx={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Video Learning */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="videos-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="videos-heading"
            eyebrow="Video Learning"
            title="Free video tutorials from top creators"
            description="Curated YouTube channels and educational videos organized for structured learning."
            action={<Link to="/search?platform=YouTube" className="text-sm font-semibold text-primary hover:underline">Explore all videos &rarr;</Link>}
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

      {/* How It Works */}
      <section className="py-16 sm:py-24" aria-labelledby="how-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="how-heading"
            eyebrow="How It Works"
            title="Start learning in four simple steps"
            description="No complex setup, no paywalls — just find and learn."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <article key={index} className="relative p-6 rounded-2xl border border-border bg-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Community Feedback */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="feedback-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="feedback-heading"
            eyebrow="Community"
            title="What learners are saying"
            description="Real feedback from real learners using LearnHub."
            action={<Link to="/feedback" className="text-sm font-semibold text-primary hover:underline">View all feedback &rarr;</Link>}
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
          <div className="overflow-hidden rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] max-w-4xl mx-auto text-center lg:text-left">
              <div>
                <h2 id="cta-heading" className="text-2xl font-bold sm:text-3xl lg:text-4xl">Ready to start learning?</h2>
                <p className="mt-3 max-w-xl text-sm opacity-90 sm:text-base lg:text-lg">
                  Join thousands of learners discovering free educational content every day. No paywalls, no subscriptions — just quality free resources.
                </p>
              </div>
              <Link to="/categories" className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-8 py-3 text-sm font-semibold text-primary hover:bg-background/90 transition-colors">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-24 bg-muted/30" aria-labelledby="team-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            id="team-heading"
            eyebrow="Team"
            title="Meet the people behind LearnHub"
            action={<Link to="/team" className="text-sm font-semibold text-primary hover:underline">View team &rarr;</Link>}
          />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {team.map((m) => (
              <article key={m.name} className="rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-primary-foreground" style={{ background: `linear-gradient(135deg, ${m.color}, var(--primary-glow))` }}>
                  {m.initials}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{m.name}</h3>
                <p className="text-xs text-primary">{m.role}</p>
                <p className="mt-2 text-xs text-muted-foreground">{m.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}