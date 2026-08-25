import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, FolderOpen, Bookmark, CreditCard, MessageSquare, TrendingUp } from "lucide-react";
import { adminService } from "../../services/adminService";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const statCards = [
    { label: "Users", value: stats.totalUsers || 0, icon: Users, color: "text-primary" },
    { label: "Resources", value: stats.totalResources || 0, icon: BookOpen, color: "text-[color:var(--success)]" },
    { label: "Categories", value: stats.totalCategories || 0, icon: FolderOpen, color: "text-[color:var(--warning)]" },
    { label: "Bookmarks", value: stats.totalBookmarks || 0, icon: Bookmark, color: "text-[color:var(--primary-glow)]" },
    { label: "Payments", value: stats.totalPayments || 0, icon: CreditCard, color: "text-[color:var(--success)]" },
    { label: "Feedback", value: stats.totalFeedback || 0, icon: MessageSquare, color: "text-primary" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your LearnHub platform</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/categories" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Manage Categories
          </Link>
          <Link to="/admin/payments" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
            Payments
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {data?.recentResources?.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold text-foreground">Recent Resources</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.recentResources.map((r) => (
                  <tr key={r._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-foreground line-clamp-1">{r.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "approved" ? "bg-[color:var(--success)]/10 text-[color:var(--success)]" :
                        r.status === "pending" ? "bg-[color:var(--warning)]/10 text-[color:var(--warning)]" :
                        "bg-destructive/10 text-destructive"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
