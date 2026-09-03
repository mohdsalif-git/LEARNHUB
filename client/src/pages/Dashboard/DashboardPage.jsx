import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, ExternalLink, User, Clock, Star, Loader2, Heart, Bell, Home } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { bookmarkService } from "../../services/bookmarkService";
import { resourceService } from "../../services/resourceService";
import { feedbackService } from "../../services/feedbackService";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Avatar } from "../../components/ui/Avatar";
import { ResourceCard } from "../../components/resources/ResourceCard";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "../../components/ui/StateComponents";
import { cn } from "../../lib/utils";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bmRes, resRes, fbRes] = await Promise.all([
        bookmarkService.getAll().catch(() => ({ data: { bookmarks: [] } })),
        resourceService.getAll({ limit: 10, sort: "createdAt", order: "desc" }).catch(() => ({ data: { resources: [] } })),
        feedbackService.getAll().catch(() => ({ data: { feedback: [] } })),
      ]);
      setBookmarks(bmRes.data?.bookmarks || []);
      setRecentResources(resRes.data?.resources || []);
      const userFeedback = fbRes.data?.feedback?.filter(f => f.user?._id === user?._id || f.email === user?.email) || [];
      setMyFeedback(userFeedback.slice(0, 5));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Saved Resources", value: bookmarks.length, icon: Bookmark, color: "text-primary" },
    { label: "Resources Viewed", value: recentResources.length, icon: ExternalLink, color: "text-[color:var(--warning)]" },
    { label: "Feedback Given", value: myFeedback.length, icon: Heart, color: "text-destructive" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16" fallback={user?.name || "U"} size="xl" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { refreshUser?.(); fetchData?.(); }}>

            <Loader2 className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border-b border-border mb-6">
        <nav className="flex gap-1" role="tablist" aria-label="Dashboard sections">
          {[
            { id: "overview", label: "Overview", icon: Home },
            { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
            { id: "feedback", label: "My Feedback", icon: Heart },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "overview" && (
        <>
          {bookmarks.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Your Saved Resources</h2>
                <Link to="/bookmarks" className="text-sm font-medium text-primary hover:underline">View all</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.slice(0, 6).map((b) => (
                  <Link key={b._id} to={`/resources/${b.resource?._id || b.resource}`} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{b.resource?.title || "Resource"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{b.resource?.platform || ""}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {recentResources.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Latest Resources</h2>
                <Link to="/search" className="text-sm font-medium text-primary hover:underline">Explore all</Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentResources.slice(0, 6).map((r) => (
                  <Link key={r._id} to={`/resources/${r._id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{r.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{r.platform} &middot; {r.level}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {bookmarks.length === 0 && recentResources.length === 0 && (
            <EmptyState type="content" action={{ label: "Browse Categories", variant: "primary", href: "/categories" }} />
          )}
        </>
      )}

      {activeTab === "bookmarks" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            {bookmarks.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookmarks.map((b) => <ResourceCard key={b._id} resource={b.resource} variant="compact" />)}
              </div>
            ) : (
              <EmptyState type="favorites" />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "feedback" && (
        <Card>
          <CardHeader>
            <CardTitle>Your Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {myFeedback.length > 0 ? (
              <div className="space-y-4">
                {myFeedback.map((f) => (
                  <div key={f._id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="h-8 w-8" fallback={f.name} />
                        <div>
                          <p className="font-medium text-foreground">{f.name}</p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <p className="text-sm text-foreground">&ldquo;{f.message}&rdquo;</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">{f.rating}/5</Badge>
                      <Badge variant={f.status === "published" ? "success" : f.status === "pending" ? "warning" : "secondary"}>{f.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState type="feedback" />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}