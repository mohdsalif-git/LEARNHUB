import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, MoreVertical, Eye, Flag, Trash2, Loader2, CheckCircle, XCircle, Star, AlertCircle, Mail } from "lucide-react";
import { adminService } from "../../services/adminService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "../../components/ui/DropdownMenu";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDistanceToNow } from "date-fns";

const STATUS_BADGES = {
  published: { variant: "success", label: "Published" },
  pending: { variant: "warning", label: "Pending" },
  hidden: { variant: "secondary", label: "Hidden" },
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminService.getAllFeedback({
        page: currentPage,
        limit: pageSize,
        search,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setFeedback(res.data?.feedback || []);
      setTotalPages(res.data?.pages || 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchFeedback, 300);
    return () => clearTimeout(timer);
  }, [fetchFeedback]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await adminService.updateFeedback(id, newStatus);
      setFeedback((prev) =>
        prev.map((f) => (f._id === id ? { ...f, status: newStatus } : f))
      );
    } catch {
      alert("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    setActionLoading(id);
    try {
      await adminService.deleteFeedback(id);
      setFeedback((prev) => prev.filter((f) => f._id !== id));
    } catch {
      alert("Failed to delete feedback");
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (item) => {
    alert(`Feedback from ${item.name}:\n\n${item.message}\n\nRating: ${item.rating}/5`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">Moderate user feedback and reviews</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search feedback"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring w-full sm:w-auto"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Failed to load feedback</p>
              <Button variant="outline" className="mt-3" onClick={fetchFeedback}>
                Retry
              </Button>
            </div>
          ) : feedback.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No feedback found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rating</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Message</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((item) => (
                      <tr key={item._id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            {item.email && <p className="text-xs text-muted-foreground">{item.email}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: item.rating }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-[color:var(--warning)] text-[color:var(--warning)]" />
                            ))}
                            <span className="text-sm font-medium ml-1">{item.rating}/5</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-sm text-foreground line-clamp-2">{item.message}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGES[item.status]?.variant || "default"}>
                            {STATUS_BADGES[item.status]?.label || item.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuItem onClick={() => handleView(item)} disabled={actionLoading === item._id}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            {item.status !== "published" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(item._id, "published")} disabled={actionLoading === item._id}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            )}
                            {item.status !== "hidden" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(item._id, "hidden")} disabled={actionLoading === item._id}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Hide
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(item._id)} disabled={actionLoading === item._id} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}