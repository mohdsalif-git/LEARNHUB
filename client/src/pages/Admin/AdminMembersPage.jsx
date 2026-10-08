import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Shield,
  UserX,
  Mail,
  Loader2,
  AlertCircle,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader, CardContent } from "../../components/ui/Card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../components/ui/DropdownMenu";
import { Skeleton } from "../../components/ui/Skeleton";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

const ROLE_BADGES = {
  admin: { variant: "destructive", label: "Admin" },
  user: { variant: "default", label: "Member" },
};

export default function AdminMembersPage() {
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(null);

  // Task 2: Confirmation modal before deleting
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await adminService.getUsers({
        page: currentPage,
        limit: pageSize,
        search,
        role: roleFilter !== "all" ? roleFilter : undefined,
        sort: sortConfig.key,
        order: sortConfig.direction,
      });
      setUsers(res.data?.users || []);
      setTotalPages(res.data?.pages || 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, roleFilter, sortConfig]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u._id)));
    }
  };

  const toggleSelect = (id) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkRoleChange = async (newRole) => {
    if (selectedUsers.size === 0) return;
    setActionLoading("bulk");
    try {
      await Promise.all(
        Array.from(selectedUsers).map((id) => adminService.updateUserRole(id, newRole))
      );
      toast.success(`Updated ${selectedUsers.size} members to ${newRole}`);
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update roles");
    } finally {
      setActionLoading(null);
    }
  };

  // Task 2: Delete user handler
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await adminService.deleteUser(userToDelete._id);
      toast.success(`User "${userToDelete.name || userToDelete.email}" removed successfully`);
      setUserToDelete(null);
      // Immediately update list
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove user");
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span className="h-4 w-4 opacity-30" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users &amp; Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage platform users, roles, and access</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleBulkRoleChange("admin")} disabled={selectedUsers.size === 0 || actionLoading === "bulk"}>
            Make Admin
          </Button>
          <Button variant="outline" onClick={() => handleBulkRoleChange("user")} disabled={selectedUsers.size === 0 || actionLoading === "bulk"}>
            Make Member
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search members"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="user">Member</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
              <p className="mt-2 text-sm text-muted-foreground">Failed to load members</p>
              <Button variant="outline" className="mt-3" onClick={fetchUsers}>
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No members found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full" role="table">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === users.length && users.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-input h-4 w-4"
                          aria-label="Select all"
                        />
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                        <div className="flex items-center gap-1">
                          Name
                          <SortIcon column="name" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("email")}>
                        <div className="flex items-center gap-1">
                          Email
                          <SortIcon column="email" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("role")}>
                        <div className="flex items-center gap-1">
                          Role
                          <SortIcon column="role" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort("createdAt")}>
                        <div className="flex items-center gap-1">
                          Joined
                          <SortIcon column="createdAt" />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const isSelf = authUser?._id === user._id || authUser?.id === user._id;

                      return (
                        <tr key={user._id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user._id)}
                              onChange={() => toggleSelect(user._id)}
                              className="rounded border-input h-4 w-4"
                              aria-label={`Select ${user.name}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                {getInitials(user.name)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground flex items-center gap-1.5">
                                  {user.name}
                                  {isSelf && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      You
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground">{user.provider === "google" ? "Google" : "Email"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">{user.email}</td>
                          <td className="px-4 py-3">
                            <Badge variant={ROLE_BADGES[user.role]?.variant || "default"}>
                              {ROLE_BADGES[user.role]?.label || user.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              {/* Task 2: Remove / Delete button with confirmation */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setUserToDelete(user)}
                                disabled={isSelf}
                                title={isSelf ? "You cannot delete your own account" : "Remove user"}
                                aria-label={`Delete ${user.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuItem
                                  onClick={() => handleRoleChange(user._id, user.role === "admin" ? "user" : "admin")}
                                  disabled={actionLoading === user._id || isSelf}
                                >
                                  {user.role === "admin" ? (
                                    <>
                                      <UserX className="h-4 w-4 mr-2" />
                                      Remove Admin
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="h-4 w-4 mr-2" />
                                      Make Admin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Copy Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setUserToDelete(user)}
                                  disabled={isSelf}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

      {/* Task 2: Confirmation Dialog for Deleting User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mt-4 text-lg font-bold text-foreground">
              Delete User Account
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{userToDelete.name || userToDelete.email}</strong>{" "}
              ({userToDelete.email})? This action cannot be undone and will delete all user data and bookmarks.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}