import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, ExternalLink, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { bookmarkService } from "../../services/bookmarkService";
import { resourceService } from "../../services/resourceService";

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      bookmarkService.getAll().catch(() => ({ data: { bookmarks: [] } })),
      resourceService.getAll({ limit: 5 }).catch(() => ({ data: { resources: [] } })),
    ]).then(([bmRes, resRes]) => {
      setBookmarks(bmRes.data.bookmarks);
      setRecent(resRes.data.resources);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full text-xl font-bold text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome, {user?.name}!</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <Bookmark className="h-5 w-5 text-primary" />
          <p className="mt-2 text-2xl font-bold text-foreground">{bookmarks.length}</p>
          <p className="text-xs text-muted-foreground">Saved Resources</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <User className="h-5 w-5 text-[color:var(--success)]" />
          <p className="mt-2 text-2xl font-bold text-foreground">{user?.role === "admin" ? "Admin" : "Member"}</p>
          <p className="text-xs text-muted-foreground">Your Role</p>
        </div>
        <Link to="/search" className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:border-primary/40">
          <ExternalLink className="h-5 w-5 text-[color:var(--warning)]" />
          <p className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary">Explore More</p>
          <p className="text-xs text-muted-foreground">Discover new resources</p>
        </Link>
      </div>

      {bookmarks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-foreground">Your Saved Resources</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookmarks.slice(0, 6).map((b) => (
              <Link key={b._id} to={`/resources/${b.resource?._id || b.resource}`} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">{b.resource?.title || "Resource"}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{b.resource?.platform || ""}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-foreground">Recent Resources</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((r) => (
              <Link key={r._id} to={`/resources/${r._id}`} className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-foreground line-clamp-1">{r.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{r.platform} &middot; {r.level}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
