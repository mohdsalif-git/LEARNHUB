import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CategoryIcon } from "../common/CategoryIcon";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Bookmark,
  Shield,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../components/ui/DropdownMenu";
import { Avatar } from "../../components/ui/Avatar";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, state, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuRef = useRef(null);

  const isLoading = state === "initializing";
  const mode = !user || isLoading ? "guest" : isAdmin ? "admin" : "user";

  // ── Link sets ────────────────────────────────────────────────────────────
  const guestLinks = [
    { to: "/", label: "Home", key: "home" },
    { to: "/categories", label: "Categories", key: "categories" },
    { to: "/search", label: "Search", key: "search" },
    { to: "/share", label: "Share", key: "share" },
  ];

  const userLinks = [
    { to: "/", label: "Home", key: "home" },
    { to: "/categories", label: "Categories", key: "categories" },
    { to: "/search", label: "Search", key: "search" },
    { to: "/bookmarks", label: "Saved", key: "bookmarks" },
    { to: "/share", label: "Share", key: "share" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Dashboard", key: "dashboard" },
    { to: "/admin/categories", label: "Categories", key: "categories" },
    { to: "/team", label: "Team", key: "team" },
  ];

  const links =
    mode === "admin" ? adminLinks : mode === "user" ? userLinks : guestLinks;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Trap focus inside mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const menu = mobileMenuRef.current;
    if (!menu) return;

    const focusable = menu.querySelectorAll(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    first?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [mobileOpen]);

  // Shared link class
  const navLinkCls = (to) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
      isActive(to)
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    );

  // Mobile list item class (44px min touch target)
  const mobileLinkCls = (to) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px]",
      isActive(to)
        ? "bg-muted text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    );

  return (
    <header
      className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Main header"
    >
      {/* ── Desktop / Tablet bar ────────────────────────────────────────── */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
          aria-label="LearnHub Home"
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
            aria-hidden="true"
          >
            <CategoryIcon icon="graduation-cap" sizePx={16} className="text-white" />
          </span>
          <span className="text-lg font-semibold">LearnHub</span>
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {links.map((l) => (
            <Link
              key={l.key}
              to={l.to}
              className={navLinkCls(l.to)}
              aria-current={isActive(l.to) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right-side controls */}
        <div className="flex items-center gap-2">
          {/* ── Guest CTA ─────────────────────────────────────────────── */}
          {!isLoading && mode === "guest" && (
            <>
              <Link
                to="/login"
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex min-h-[40px]"
                aria-label="Login"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="hidden items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-primary-foreground sm:inline-flex min-h-[40px]"
                style={{ background: "var(--gradient-hero)" }}
                aria-label="Get Started"
              >
                Get Started
              </Link>
            </>
          )}

          {/* ── Logged-in user: avatar dropdown (desktop ≥ lg) ────────── */}
          {!isLoading && mode === "user" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild aria-label="User menu">
                <button
                  className="hidden lg:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors min-h-[40px]"
                  aria-label="User menu"
                >
                  <Avatar className="h-8 w-8" fallback={user?.name || "U"} />
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/bookmarks">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved Resources
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenu>
          )}

          {/* ── Admin dropdown (desktop ≥ lg) ──────────────────────────── */}
          {!isLoading && mode === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild aria-label="Admin menu">
                <button
                  className="hidden lg:flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors min-h-[40px]"
                  aria-label="Admin menu"
                >
                  <Avatar className="h-8 w-8" fallback={user?.name || "A"} />
                  <span className="text-sm font-medium max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-60 shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuLabel>Admin</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to="/admin/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/categories">
                  <Settings className="h-4 w-4 mr-2" />
                  Categories
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenu>
          )}

          {/* ── Hamburger (visible on < lg) ─────────────────────────────── */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden min-h-[44px] min-w-[44px]"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile / Tablet slide-in menu (< lg) ───────────────────────────── */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className="border-t border-border bg-background lg:hidden animate-slide-up"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col px-3 py-3 gap-0.5">

            {/* User info banner (logged-in only) */}
            {!isLoading && mode !== "guest" && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-3 mb-2">
                <Avatar className="h-9 w-9 shrink-0" fallback={user?.name || "U"} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                {mode === "admin" && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>
            )}

            {/* Navigation links */}
            {links.map((l) => (
              <Link
                key={l.key}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={mobileLinkCls(l.to)}
                aria-current={isActive(l.to) ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="my-1 border-t border-border" />

            {/* Guest actions */}
            {mode === "guest" && (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] text-foreground hover:bg-muted/60"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center rounded-lg px-3 py-3 text-sm font-semibold text-primary-foreground min-h-[44px]"
                  style={{ background: "var(--gradient-hero)" }}
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Logged-in user actions */}
            {mode === "user" && (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <User className="h-4 w-4 shrink-0" /> Profile
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" /> Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] text-destructive hover:bg-destructive/10 text-left w-full"
                >
                  <LogOut className="h-4 w-4 shrink-0" /> Logout
                </button>
              </>
            )}

            {/* Admin actions */}
            {mode === "admin" && (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" /> Admin Dashboard
                </Link>
                <Link
                  to="/admin/categories"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <Settings className="h-4 w-4 shrink-0" /> Categories
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium min-h-[44px] text-destructive hover:bg-destructive/10 text-left w-full"
                >
                  <LogOut className="h-4 w-4 shrink-0" /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}