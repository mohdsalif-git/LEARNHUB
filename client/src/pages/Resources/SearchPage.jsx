import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { resourceService } from "../../services/resourceService";
import { categories } from "../../lib/data";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("");

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    fetchResources(q);
  }, [searchParams]);

  async function fetchResources(searchQuery) {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (category) params.category = category;
      if (level) params.level = level;
      if (sort) params.sort = sort;
      const res = await resourceService.getAll(params);
      setResources(res.data.resources);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    setSearchParams(params);
    fetchResources(query);
  }

  function handleFilterChange() {
    fetchResources(query);
  }

  useEffect(() => {
    handleFilterChange();
  }, [category, level, sort]);

  function clearFilters() {
    setCategory("");
    setLevel("");
    setSort("");
  }

  const hasFilters = category || level || sort;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">Search Resources</h1>
      <p className="mt-2 text-sm text-muted-foreground">Find free learning resources across all categories</p>

      <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2 rounded-full border border-border bg-background p-2 shadow-[var(--shadow-card)]">
        <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, description, or tag..."
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button type="submit" className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">Newest</option>
          <option value="rating">Highest Rated</option>
          <option value="title">Alphabetical</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : resources.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-foreground">No resources found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{resources.length} resource{resources.length !== 1 ? "s" : ""} found</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((r) => <ResourceCard key={r._id} resource={r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
