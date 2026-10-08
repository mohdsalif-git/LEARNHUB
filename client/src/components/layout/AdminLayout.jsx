import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderOpen,
  MessageSquare,
  CreditCard,
  BarChart2,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../components/ui/DropdownMenu";

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/admin/members", icon: Users },
  { name: "Resources", href: "/admin/resources", icon: BookOpen },
  { name: "Categories", href: "/admin/categories", icon: FolderOpen },
  { name: "Site Content", href: "/admin/content", icon: Sparkles },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    logout();
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out shrink-0",
          "lg:static lg:translate-x-0",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64",
          sidebarOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Admin navigation"
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-3.5 border-b border-border shrink-0">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-2.5 font-bold tracking-tight min-w-0"
            aria-label="LearnHub Admin"
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-sm"
              style={{ background: "var(--gradient-hero)" }}
            >
              <LayoutDashboard className="h-5 w-5 text-white" />
            </span>
            {!sidebarCollapsed && (
              <span className="text-base font-semibold truncate text-foreground">
                LearnHub Admin
              </span>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Sidebar Nav Items */}
        <nav
          className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1 scrollbar-thin"
          role="navigation"
          aria-label="Admin main navigation"
        >
          {navigation.map((item) => {
            const isActive =
              location.pathname === item.href ||
              location.pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                  sidebarCollapsed
                    ? "justify-center px-2 py-2.5"
                    : "px-3 py-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Menu */}
        <div className="border-t border-border p-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
                  sidebarCollapsed && "justify-center px-0"
                )}
                aria-label="Admin user options"
              >
                <Avatar
                  className="h-8 w-8 shrink-0"
                  fallback={user?.name?.charAt(0)?.toUpperCase() || "A"}
                />
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {user?.name || "Admin"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {user?.email || ""}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuLabel>Admin Account</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/admin/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Site
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 shrink-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="Open sidebar menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Site
              </Link>

              <div className="h-5 w-px bg-border hidden sm:block" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Avatar
                      className="h-7 w-7"
                      fallback={user?.name?.charAt(0)?.toUpperCase() || "A"}
                    />
                    <span className="hidden md:inline-block text-xs font-medium text-foreground">
                      {user?.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link to="/admin/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}