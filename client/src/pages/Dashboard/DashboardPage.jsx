import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Bookmark,
  ExternalLink,
  User,
  Clock,
  Eye,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Coffee,
  Heart,
  Home,
  Loader2,
  Calendar,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { bookmarkService } from "../../services/bookmarkService";
import { userService } from "../../services/userService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Avatar } from "../../components/ui/Avatar";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "../../components/ui/StateComponents";
import { cn } from "../../lib/utils";
import toast from "react-hot-toast";

const DONATION_URL =
  import.meta.env.VITE_BUY_ME_A_COFFEE_URL || "https://buymeacoffee.com/learnhub";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [viewHistory, setViewHistory] = useState([]);
  const [statsData, setStatsData] = useState({ savedCount: 0, viewedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Filters for Saved Resources Tab
  const [savedSearch, setSavedSearch] = useState("");
  const [savedSort, setSavedSort] = useState("recent");
  const [savedCategory, setSavedCategory] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bmRes, histRes, statsRes] = await Promise.all([
        bookmarkService.getAll().catch(() => ({ data: { bookmarks: [] } })),
        userService.getViewHistory({ limit: 30 }).catch(() => ({ data: { history: [] } })),
        userService.getDashboardStats().catch(() => ({ data: { savedCount: 0, viewedCount: 0 } })),
      ]);

      setBookmarks(bmRes.data?.bookmarks || []);
      setViewHistory(histRes.data?.history || []);
      setStatsData(
        statsRes.data || {
          savedCount: bmRes.data?.bookmarks?.length || 0,
          viewedCount: histRes.data?.history?.length || 0,
        }
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Remove bookmark handler
  const handleRemoveBookmark = async (resourceId) => {
    try {
      await bookmarkService.remove(resourceId);
      setBookmarks((prev) =>
        prev.filter((b) => (b.resource?._id || b.resource) !== resourceId)
      );
      setStatsData((prev) => ({
        ...prev,
        savedCount: Math.max(0, prev.savedCount - 1),
      }));
      toast.success("Resource removed from saved collection");
    } catch {
      toast.error("Failed to remove saved resource");
    }
  };

  // Remove history item handler
  const handleRemoveHistoryItem = async (resourceId) => {
    try {
      await userService.removeHistoryItem(resourceId);
      setViewHistory((prev) =>
        prev.filter((h) => (h.resource?._id || h.resource) !== resourceId)
      );
      setStatsData((prev) => ({
        ...prev,
        viewedCount: Math.max(0, prev.viewedCount - 1),
      }));
      toast.success("Item removed from history");
    } catch {
      toast.error("Failed to remove history item");
    }
  };

  // Filtered bookmarks for Saved Resources Tab
  const filteredBookmarks = bookmarks
    .filter((b) => {
      const r = b.resource;
      if (!r) return false;
      const matchesSearch =
        !savedSearch ||
        r.title?.toLowerCase().includes(savedSearch.toLowerCase()) ||
        r.description?.toLowerCase().includes(savedSearch.toLowerCase()) ||
        r.platform?.toLowerCase().includes(savedSearch.toLowerCase());
      const matchesCategory =
        savedCategory === "all" ||
        r.category === savedCategory ||
        r.categoryId?.slug === savedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (savedSort === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      if (savedSort === "rating") {
        return (b.resource?.rating || 0) - (a.resource?.rating || 0);
      }
      // default: recent
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  // Extract unique categories from saved resources
  const availableCategories = Array.from(
    new Set(
      bookmarks
        .map((b) => b.resource?.category)
        .filter(Boolean)
    )
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-10 w-72" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Saved Resources",
      value: bookmarks.length,
      icon: Bookmark,
      color: "text-primary",
      description: "Resources saved for later",
    },
    {
      label: "Recently Viewed",
      value: viewHistory.length,
      icon: Eye,
      color: "text-[color:var(--warning)]",
      description: "Learning materials explored",
    },
    {
      label: "Learning Journey",
      value: user?.createdAt
        ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: false })
        : "Active",
      icon: Clock,
      color: "text-[color:var(--success)]",
      description: "Member duration",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      {/* User Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16" fallback={user?.name || "U"} size="xl" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.name || "Learner"}!
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshUser?.();
              fetchData?.();
            }}
          >
            <Loader2 className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Link to="/search">
            <Button size="sm">Explore Catalog</Button>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-muted/60", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-2 overflow-x-auto pb-px" role="tablist" aria-label="Dashboard sections">
          {[
            { id: "overview", label: "Overview", icon: Home },
            { id: "saved", label: "Saved Resources", icon: Bookmark, count: bookmarks.length },
            { id: "history", label: "Recently Viewed", icon: Eye, count: viewHistory.length },
            { id: "account", label: "Profile & Account", icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={cn(
                    "ml-1 text-xs px-1.5 py-0.5 rounded-full",
                    activeTab === tab.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Saved Resources Snapshot */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Saved Resources</h2>
              </div>
              {bookmarks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("saved")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all ({bookmarks.length})
                </button>
              )}
            </div>

            {bookmarks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.slice(0, 6).map((b) => {
                  const r = b.resource;
                  if (!r) return null;
                  return (
                    <div
                      key={b._id}
                      className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="subtle" className="text-[10px]">
                            {r.platform || "Web"}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <Link
                          to={`/resources/${r._id}`}
                          className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors"
                        >
                          {r.title}
                        </Link>
                        {r.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {r.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                        <Link
                          to={`/resources/${r._id}`}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          View Details
                        </Link>
                        <div className="flex items-center gap-1">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-muted-foreground hover:text-foreground rounded"
                            title="Open external resource"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveBookmark(r._id)}
                            className="p-1 text-muted-foreground hover:text-destructive rounded"
                            title="Remove from saved"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-8">
                <CardContent className="space-y-3">
                  <Bookmark className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-foreground">You haven't saved any resources yet.</p>
                  <p className="text-xs text-muted-foreground">Bookmark free courses and guides as you explore LearnHub.</p>
                  <Link to="/search">
                    <Button variant="outline" size="sm" className="mt-2">
                      Explore Resources
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Recently Viewed Resources Snapshot */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[color:var(--warning)]" />
                <h2 className="text-lg font-bold text-foreground">Recently Viewed</h2>
              </div>
              {viewHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View full history ({viewHistory.length})
                </button>
              )}
            </div>

            {viewHistory.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {viewHistory.slice(0, 6).map((item) => {
                  const r = item.resource;
                  if (!r) return null;
                  return (
                    <div
                      key={item._id}
                      className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge variant="subtle" className="text-[10px]">
                            {r.platform || "Web"}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDistanceToNow(new Date(item.lastViewedAt), { addSuffix: true })}
                          </span>
                        </div>
                        <Link
                          to={`/resources/${r._id}`}
                          className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors"
                        >
                          {r.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {r.category} &middot; {r.level || "Beginner"}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                        <Link
                          to={`/resources/${r._id}`}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          View Details
                        </Link>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center py-8">
                <CardContent className="space-y-3">
                  <Eye className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-foreground">No recent viewing history.</p>
                  <p className="text-xs text-muted-foreground">Resources you open will automatically appear here.</p>
                  <Link to="/search">
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Catalog
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>

          {/* Subtle Buy Me A Coffee Support Card */}
          <section className="rounded-2xl border border-border bg-card/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-xl bg-[color:var(--warning)]/10 text-[color:var(--warning)] flex items-center justify-center shrink-0">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Enjoying LearnHub?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Help support the platform and keep free education accessible to everyone.
                </p>
              </div>
            </div>
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--warning)] px-4 py-2 text-xs font-semibold text-black hover:opacity-90 transition-opacity shrink-0"
              aria-label="Buy us a coffee"
            >
              <Coffee className="h-4 w-4" />
              Buy us a coffee
            </a>
          </section>
        </div>
      )}

      {/* SAVED RESOURCES TAB */}
      {activeTab === "saved" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Manage Saved Resources</h2>
              <p className="text-sm text-muted-foreground">
                Filter, organize, or remove resources from your personal collection
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/search">
                <Button size="sm">Find More Resources</Button>
              </Link>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search saved resources..."
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <select
              value={savedCategory}
              onChange={(e) => setSavedCategory(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={savedSort}
              onChange={(e) => setSavedSort(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              aria-label="Sort order"
            >
              <option value="recent">Recently Saved</option>
              <option value="oldest">Oldest Saved</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Saved Resources List */}
          {filteredBookmarks.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBookmarks.map((b) => (
                <ResourceCard
                  key={b._id}
                  resource={b.resource}
                  bookmarked={true}
                  onBookmarkToggle={() => handleRemoveBookmark(b.resource?._id || b.resource)}
                />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Bookmark className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {bookmarks.length === 0 ? "You haven't saved any resources yet." : "No matching resources found."}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {bookmarks.length === 0
                  ? "Explore the catalog to save top-rated courses, books, and interactive tutorials."
                  : "Try adjusting your search or category filters."}
              </p>
              {bookmarks.length === 0 && (
                <Link to="/search" className="mt-4 inline-block">
                  <Button>Explore Resources</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* RECENTLY VIEWED TAB */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Learning History</h2>
              <p className="text-sm text-muted-foreground">
                Resources you have recently explored and opened
              </p>
            </div>
          </div>

          {viewHistory.length > 0 ? (
            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {viewHistory.map((item) => {
                const r = item.resource;
                if (!r) return null;
                return (
                  <div
                    key={item._id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/resources/${r._id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {r.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="subtle" className="text-[10px]">
                            {r.platform}
                          </Badge>
                          <span>&middot;</span>
                          <span>{r.category}</span>
                          <span>&middot;</span>
                          <span>Viewed {formatDistanceToNow(new Date(item.lastViewedAt), { addSuffix: true })}</span>
                          {item.viewCount > 1 && (
                            <>
                              <span>&middot;</span>
                              <span>{item.viewCount} visits</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveHistoryItem(r._id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded transition-colors"
                        title="Remove from history"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-base font-semibold text-foreground">No viewing history yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                As you open and learn from resources across LearnHub, your history will appear here.
              </p>
              <Link to="/search" className="mt-4 inline-block">
                <Button>Explore Catalog</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ACCOUNT / PROFILE TAB */}
      {activeTab === "account" && (
        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
              <CardDescription>Your LearnHub account and profile summary</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm font-semibold text-foreground mt-1">{user?.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Email Address</label>
                <p className="text-sm font-semibold text-foreground mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Role</label>
                <Badge variant="subtle" className="mt-1 text-xs capitalize">
                  {user?.role || "Member"}
                </Badge>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">Account Status</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recent"}
                </p>
              </div>
            </CardContent>
            <div className="p-4 border-t border-border flex justify-between items-center">
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  Edit Profile & Password
                </Button>
              </Link>
              <a
                href={DONATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Coffee className="h-3.5 w-3.5 text-[color:var(--warning)]" />
                Support LearnHub
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}