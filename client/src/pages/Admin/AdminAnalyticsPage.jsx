import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Eye,
  Bookmark,
  TrendingUp,
  CreditCard,
  MessageSquare,
  Calendar,
  AlertCircle,
  ExternalLink,
  Star,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { Button } from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { cn } from "../../lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [topTab, setTopTab] = useState("views");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminService.getAnalytics(period);
      setData(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = data?.summary || {};
  const userGrowth = data?.userGrowth || [];
  const resourceGrowth = data?.resourceGrowth || [];
  const categoryDistribution = data?.categoryDistribution || [];
  const platformDistribution = data?.platformDistribution || [];
  const topViewed = data?.topViewed || [];
  const topBookmarked = data?.topBookmarked || [];

  // Merge growth data by date for combined chart
  const datesSet = new Set([
    ...userGrowth.map((u) => u.date),
    ...resourceGrowth.map((r) => r.date),
  ]);
  const sortedDates = Array.from(datesSet).sort();

  const userMap = Object.fromEntries(userGrowth.map((u) => [u.date, u.count]));
  const resMap = Object.fromEntries(resourceGrowth.map((r) => [r.date, r.count]));

  const combinedGrowthData = sortedDates.map((date) => ({
    date: date.slice(5), // MM-DD for readability
    fullDate: date,
    Users: userMap[date] || 0,
    Resources: resMap[date] || 0,
  }));

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Failed to load analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">Could not retrieve real database metrics.</p>
        <Button variant="outline" className="mt-4" onClick={fetchAnalytics}>
          Retry
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: summary.totalUsers || 0,
      periodValue: `+${summary.newUsers || 0} in period`,
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Total Resources",
      value: summary.totalResources || 0,
      periodValue: `+${summary.newResources || 0} in period`,
      icon: BookOpen,
      color: "text-[color:var(--success)]",
    },
    {
      label: "Resource Views",
      value: summary.totalViews || 0,
      periodValue: `+${summary.periodViews || 0} in period`,
      icon: Eye,
      color: "text-[color:var(--warning)]",
    },
    {
      label: "Saved Resources",
      value: summary.totalBookmarks || 0,
      periodValue: `+${summary.periodBookmarks || 0} in period`,
      icon: Bookmark,
      color: "text-primary",
    },
    {
      label: "Avg. Feedback Rating",
      value: summary.avgRating ? `${summary.avgRating} / 5` : "N/A",
      periodValue: `${summary.totalFeedback || 0} total reviews`,
      icon: Star,
      color: "text-[color:var(--warning)]",
    },
    {
      label: "Supporters & Revenue",
      value: `₹${summary.totalRevenue || 0}`,
      periodValue: `${summary.totalPayments || 0} donations`,
      icon: CreditCard,
      color: "text-[color:var(--success)]",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live metrics aggregated directly from the database
          </p>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1">
          <Calendar className="ml-2 h-4 w-4 text-muted-foreground hidden sm:block" />
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                period === opt.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-muted/60", s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.periodValue}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Growth Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Growth Trends</CardTitle>
            <CardDescription>New user registrations and resource additions</CardDescription>
          </CardHeader>
          <CardContent>
            {combinedGrowthData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={combinedGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-primary, #6366f1)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card, #1e293b)",
                        borderColor: "var(--color-border, #334155)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Users"
                      stroke="var(--color-primary, #6366f1)"
                      fillOpacity={1}
                      fill="url(#userGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Resources"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#resGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                Not enough growth activity recorded in this date range.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Resources by Category</CardTitle>
            <CardDescription>Top content distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryDistribution.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryDistribution}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card, #1e293b)",
                        borderColor: "var(--color-border, #334155)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="count" fill="var(--color-primary, #6366f1)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                No categories available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Resources & Content Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Resources Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Top Performing Content</CardTitle>
              <CardDescription>Most engaged learning resources on LearnHub</CardDescription>
            </div>
            <div className="flex rounded-lg border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setTopTab("views")}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors",
                  topTab === "views" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Most Viewed
              </button>
              <button
                type="button"
                onClick={() => setTopTab("bookmarks")}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-colors",
                  topTab === "bookmarks" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Most Saved
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {topTab === "views" ? (
              topViewed.length > 0 ? (
                <div className="divide-y divide-border">
                  {topViewed.map((item, idx) => (
                    <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.platform} &middot; {item.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="subtle" className="text-xs">
                          <Eye className="h-3 w-3 mr-1" /> {item.totalViews} views
                        </Badge>
                        <Link to={`/resources/${item._id}`} className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No view history recorded yet.
                </p>
              )
            ) : topBookmarked.length > 0 ? (
              <div className="divide-y divide-border">
                {topBookmarked.map((item, idx) => (
                  <div key={item._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-5 text-center">{idx + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.platform} &middot; {item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="subtle" className="text-xs">
                        <Bookmark className="h-3 w-3 mr-1" /> {item.count} saves
                      </Badge>
                      <Link to={`/resources/${item._id}`} className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-sm text-muted-foreground">
                No saved resources recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Content Sources</CardTitle>
            <CardDescription>Breakdown by learning platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {platformDistribution.length > 0 ? (
              platformDistribution.map((p) => {
                const total = summary.totalResources || 1;
                const pct = Math.round((p.count / total) * 100);
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground">{p.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center py-8 text-sm text-muted-foreground">No source data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
