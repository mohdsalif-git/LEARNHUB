import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, X } from "lucide-react";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { resourceService } from "../../services/resourceService";
import { categories } from "../../lib/data";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/Select";
import { EmptyState, LoadingState } from "../../components/ui/StateComponents";
import { SectionHeader } from "../../components/common/SectionHeader";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("");

  const fetchResources = useCallback(async (searchQuery) => {
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
  }, [category, level, sort]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    fetchResources(q);
  }, [searchParams, fetchResources]);

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
      <SectionHeader
        eyebrow="Search"
        title="Search Resources"
        description="Find free learning resources across all categories"
      />

      <form onSubmit={handleSearch} className="mt-6 flex items-center gap-2 rounded-full border border-border bg-background p-2 shadow-[var(--shadow-card)]">
        <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, description, or tag..."
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          aria-label="Search resources"
        />
        <Button type="submit" className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3" role="search" aria-label="Filters">
        <Select value={category} onValueChange={setCategory} aria-label="Filter by category">
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel} aria-label="Filter by level">
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort} aria-label="Sort by">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Newest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Newest</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="title">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1" aria-label="Clear all filters">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="mt-8" role="region" aria-label="Search results" aria-live="polite">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading resources">
            {[1, 2, 3, 4, 5, 6].map((i) => <LoadingState key={i} type="spinner" size="lg" />)}
          </div>
        ) : resources.length === 0 ? (
          <EmptyState type="search" />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">{resources.length} resource{resources.length !== 1 ? "s" : ""} found</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {resources.map((r) => (
                <ResourceCard key={r._id} resource={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}