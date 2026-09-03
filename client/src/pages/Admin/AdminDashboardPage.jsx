import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, FolderOpen, Bookmark, CreditCard, MessageSquare, TrendingUp, Clock, UserPlus, FileText, Star, AlertTriangle } from "lucide-react";
import { adminService } from "../../services/adminService";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils";

const statCards = [
  { label: "Users", key: "totalUsers", icon: Users, color: "text-primary", trend: "+12%", trendLabel: "this month" },
  { label: "Resources", key: "totalResources", icon: BookOpen, color: "text-[color:var(--success)]", trend: "+8%", trendLabel: "this month" },
  { label: "Categories", key: "totalCategories", icon: FolderOpen, color: "text-[color:var(--warning)]", trend: "—", trendLabel: "" },
  { label: "Bookmarks", key: "totalBookmarks", icon: Bookmark, color: "text-[color:var(--primary-glow)]", trend: "+23%", trendLabel: "this month" },
  { label: "Payments", key: "totalPayments", icon: CreditCard, color: "text-[color:var(--success)]", trend: "+5%", trendLabel: "this month" },
  { label: "Feedback", key: "totalFeedback", icon: MessageSquare, color: "text-primary", trend: "+18%", trendLabel: "this month" },
];

const activityIcons = {
  user_registered: UserPlus,
  resource_created: FileText,
  resource_approved: Star,
  feedback_submitted: MessageSquare,
  payment_received: CreditCard,
};

const activityLabels = {
  user_registered: "New user registered",
  resource_created: "Resource submitted",
  resource_approved: "Resource approved",
  feedback_submitted: "Feedback received",
  payment_received: "Payment received",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminService.getDashboard();
      setData(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="mt-8">
          <Skeleton className="h-6 w-48" />
          <div className="mt-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Failed to load dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Please try again later.</p>
        <Button variant="outline" className="mt-4" onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentResources = data?.recentResources || [];
  const recentPayments = data?.recentPayments || [];
  const recentFeedback = data?.recentFeedback || [];

  // Build activity timeline from real data
  const activities = [
    ...recentResources.slice(0, 3).map((r) => ({
      id: `resource-${r._id}`,
      type: r.status === "approved" ? "resource_approved" : "resource_created",
      title: r.title,
      meta: r.submittedBy?.name || "Unknown",
      time: r.createdAt,
    })),
    ...recentFeedback.slice(0, 2).map((f) => ({
      id: `feedback-${f._id}`,
      type: "feedback_submitted",
      title: f.message.substring(0, 50) + "...",
      meta: f.name,
      time: f.createdAt,
    })),
    ...recentPayments.slice(0, 1).map((p) => ({
      id: `payment-${p._id}`,
      type: "payment_received",
      title: `${p.currency} ${p.amount}`,
      meta: p.supporterName || "Anonymous",
      time: p.createdAt,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of your LearnHub platform</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/categories">
            <Button>Manage Categories</Button>
          </Link>
          <Link to="/admin/members">
            <Button variant="outline">View Members</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats[s.key] || 0}</div>
              {s.trend !== "—" && (
                <div className="flex items-center gap-1 mt-1 text-xs text-[color:var(--success)]">
                  <TrendingUp className="h-3 w-3" />
                  <span>{s.trend} {s.trendLabel}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = activityIcons[activity.type] || FileText;
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          activity.type === "payment_received" && "bg-[color:var(--success)]/10 text-[color:var(--success)]",
                          activity.type === "resource_approved" && "bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
                          activity.type === "user_registered" && "bg-primary/10 text-primary",
                          activity.type === "resource_created" && "bg-[color:var(--info)]/10 text-[color:var(--info)]",
                          activity.type === "feedback_submitted" && "bg-[color:var(--destructive)]/10 text-destructive",
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {index < activities.length - 1 && (
                          <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium text-foreground">{activityLabels[activity.type] || activity.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">{activity.meta} • {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Quick Actions
              <span className="text-xs text-muted-foreground">Common tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/admin/resources" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-muted/50 transition-colors">
                <FileText className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-medium text-foreground group-hover:text-primary">Manage Resources</h3>
                <p className="mt-1 text-xs text-muted-foreground">Review, approve, or edit resources</p>
              </Link>
              <Link to="/admin/members" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-muted/50 transition-colors">
                <Users className="h-5 w-5 text-[color:var(--success)] mb-2" />
                <h3 className="font-medium text-foreground group-hover:text-primary">Manage Members</h3>
                <p className="mt-1 text-xs text-muted-foreground">View and manage user accounts</p>
              </Link>
              <Link to="/admin/categories" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-muted/50 transition-colors">
                <FolderOpen className="h-5 w-5 text-[color:var(--warning)] mb-2" />
                <h3 className="font-medium text-foreground group-hover:text-primary">Manage Categories</h3>
                <p className="mt-1 text-xs text-muted-foreground">Add, edit, or remove categories</p>
              </Link>
              <Link to="/admin/feedback" className="group relative rounded-lg border border-border p-4 hover:border-primary/40 hover:bg-muted/50 transition-colors">
                <MessageSquare className="h-5 w-5 text-destructive mb-2" />
                <h3 className="font-medium text-foreground group-hover:text-primary">Moderate Feedback</h3>
                <p className="mt-1 text-xs text-muted-foreground">Review and publish feedback</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}