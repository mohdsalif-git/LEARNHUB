import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Search, Trash2, ArrowUpDown, Filter, AlertCircle, Loader2 } from "lucide-react";
import { bookmarkService } from "../../services/bookmarkService";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Skeleton } from "../../components/ui/Skeleton";
import toast from "react-hot-toast";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await bookmarkService.getAll();
      setBookmarks(res.data?.bookmarks || []);
    } catch {
      setError(true);
      toast.error("Failed to load saved resources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleRemove = async (resourceId) => {
    try {
      await bookmarkService.remove(resourceId);
      setBookmarks((prev) =>
        prev.filter((b) => (b.resource?._id || b.resource) !== resourceId)
      );
      toast.success("Resource removed from saved collection");
    } catch {
      toast.error("Failed to remove saved resource");
    }
  };

  // Extract available categories
  const categories = Array.from(
    new Set(bookmarks.map((b) => b.resource?.category).filter(Boolean))
  );

  // Filter & sort
  const filtered = bookmarks
    .filter((b) => {
      const r = b.resource;
      if (!r) return false;
      const matchesSearch =
        !search ||
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase()) ||
        r.platform?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        category === "all" ||
        r.category === category ||
        r.categoryId?.slug === category;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (sort === "rating") {
        return (b.resource?.rating || 0) - (a.resource?.rating || 0);
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Saved Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {bookmarks.length > 0
              ? `You have saved ${bookmarks.length} learning ${bookmarks.length === 1 ? "resource" : "resources"}`
              : "Your bookmarked learning resources"}
          </p>
        </div>
        <Link to="/search">
          <Button variant="outline">Browse Catalog</Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      {bookmarks.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your saved resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search saved resources"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            aria-label="Sort resources"
          >
            <option value="recent">Recently Saved</option>
            <option value="oldest">Oldest Saved</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Failed to load bookmarks</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please check your network connection and try again.</p>
            <Button variant="outline" className="mt-4" onClick={loadBookmarks}>
              Retry
            </Button>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-border rounded-2xl bg-card/40 p-8">
            <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">You haven't saved any resources yet.</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
              Start exploring our free courses, documentation, and videos to save resources you love.
            </p>
            <Link
              to="/search"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Explore Resources
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-base font-semibold text-foreground">No matching saved resources</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing your search query or category filter.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <ResourceCard
                key={b._id}
                resource={b.resource}
                bookmarked={true}
                onBookmarkToggle={() => handleRemove(b.resource?._id || b.resource)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
