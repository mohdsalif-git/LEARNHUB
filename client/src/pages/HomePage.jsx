import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Share2, Coffee, Sparkles, BadgeCheck, Users, Heart, Star } from "lucide-react";
import { ResourceCard } from "../components/resources/ResourceCard";
import { SectionHeader } from "../components/common/SectionHeader";
import { AdSlot } from "../components/common/AdSlot";
import { CommunityPicks } from "../components/common/CommunityPicks";
import { CategoryIcon } from "../components/common/CategoryIcon";
import { categories, popularTags, team } from "../lib/data";

export default function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/resources?featured=true&limit=6`)
      .then((r) => r.json())
      .then((res) => setResources(res.data?.resources || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-soft)" }}>
        <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden />
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full opacity-30 blur-3xl" style={{ background: "var(--gradient-hero)" }} aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 left-[-10%] h-[360px] w-[360px] rounded-full opacity-20 blur-3xl" style={{ background: "linear-gradient(135deg, var(--secondary), var(--primary-glow))" }} aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-primary shadow-[var(--shadow-card)]">
              <Sparkles className="h-3.5 w-3.5" /> One Search. All Knowledge. Zero Cost.
            </span>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
              Find the Best <span className="text-gradient">Free Learning</span> Resources in One Place
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Search free videos, tutorials and courses from YouTube, Edureka, Google, freeCodeCamp and more — organized for faster learning.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(q)}`); }}
              className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-full border border-border bg-background p-2 shadow-[var(--shadow-elevated)]"
              role="search"
            >
              <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try 'React', 'Python', 'System Design'…"
                aria-label="Search free learning resources"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-hero)" }}
              >
                Search
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Popular:</span>
              {popularTags.map((t) => (
                <Link
                  key={t}
                  to={`/search?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                >
                  {t}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link to="/categories" className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-primary">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/share" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted">
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

          <div className="relative mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "15+", l: "Curated resources" },
              { k: `${categories.length}`, l: "Learning tracks" },
              { k: "100%", l: "Free, forever" },
              { k: "0$", l: "Cost to learn" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-border bg-background/70 px-4 py-3 text-center backdrop-blur-sm shadow-[var(--shadow-card)]">
                <div className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{s.k}</div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <AdSlot />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <SectionHeader
          eyebrow="Browse"
          title="Learn by category"
          description="Curated free resources organized by topic — pick a track and dive in."
          action={<Link to="/categories" className="text-sm font-semibold text-primary hover:underline">View all &rarr;</Link>}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.slice(0, 8).map((c) => (
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
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeader eyebrow="Trending" title="Featured free resources" description="Hand-picked, fully free, links straight to the source." />
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => <ResourceCard key={r._id} resource={r} />)}
          </div>
        )}
      </section>

      <CommunityPicks limit={6} />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-3xl p-8 text-primary-foreground sm:p-12" style={{ background: "var(--gradient-hero)" }}>
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Found a great free resource?</h2>
              <p className="mt-2 max-w-xl text-sm opacity-90 sm:text-base">
                Share it with thousands of learners. Our community grows when you contribute.
              </p>
            </div>
            <Link to="/share" className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-primary hover:bg-background/90">
              <Share2 className="h-4 w-4" /> Share a Resource
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[color:var(--warning)]/20 text-[color:var(--warning)]">
              <Coffee className="h-6 w-6" />
            </span>
            <h3 className="text-xl font-bold">Support the platform</h3>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Love this free platform? A small coffee donation keeps it free and growing for everyone.
          </p>
          <Link to="/support" className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary">
            <Coffee className="h-4 w-4" /> Buy Us a Coffee
          </Link>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <h3 className="text-xl font-bold">What learners are saying</h3>
          <div className="mt-4 space-y-3">
            {[
              { name: "Ananya R.", message: "Saved me hours of searching. Finally a clean place for free learning!", rating: 5 },
              { name: "Marcus L.", message: "Love the categories and how everything links straight to the source.", rating: 5 },
            ].map((f) => (
              <figure key={f.name} className="rounded-xl bg-muted/60 p-4">
                <blockquote className="text-sm text-foreground">&ldquo;{f.message}&rdquo;</blockquote>
                <figcaption className="mt-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span>&mdash; {f.name}</span>
                  <span className="inline-flex items-center gap-0.5 text-[color:var(--warning)]">
                    {Array.from({ length: f.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <Link to="/feedback" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Give your feedback &rarr;</Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionHeader eyebrow="Team" title="Meet the people behind LearnHub" action={<Link to="/team" className="text-sm font-semibold text-primary hover:underline">View team &rarr;</Link>} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {team.map((m) => (
            <div key={m.name} className="rounded-2xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)]">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full text-lg font-bold text-primary-foreground" style={{ background: `linear-gradient(135deg, ${m.color}, var(--primary-glow))` }}>{m.initials}</div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{m.name}</h3>
              <p className="text-xs text-muted-foreground">{m.role}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
