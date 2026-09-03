import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CategoryIcon } from "../common/CategoryIcon";
import { Menu, X, User, LogOut, LayoutDashboard, Settings, ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "../../components/ui/DropdownMenu";
import { Avatar, AvatarFallback } from "../../components/ui/Avatar";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuRef = useRef(null);

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

  const mode = !user ? "guest" : isAdmin ? "admin" : "user";
  const links = mode === "admin" ? adminLinks : mode === "user" ? userLinks : guestLinks;

  const handleSignOut = () => {
    logout();
    navigate("/");
    setUserMenuOpen(false);
  };

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Trap focus in mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const menu = mobileMenuRef.current;
    if (!menu) return;

    const focusableElements = menu.querySelectorAll(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => document.removeEventListener("keydown", handleTab);
  }, [mobileOpen]);

  return (
    <header
      className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      aria-label="Main header"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight" aria-label="LearnHub Home">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
            aria-hidden="true"
          >
            <CategoryIcon icon="graduation-cap" sizePx={16} className="text-white" />
          </span>
          <span className="text-lg font-semibold">LearnHub</span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary navigation"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(l.to)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              aria-current={isActive(l.to) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && mode === "guest" && (
            <>
              <Link
                to="/login"
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
                aria-label="Login"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hidden items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-primary-foreground sm:inline-flex"
                style={{ background: "var(--gradient-hero)" }}
                aria-label="Get Started"
              >
                Get Started
              </Link>
            </>
          )}

          {!loading && mode === "user" && (
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Dashboard"
              >
                <User className="h-4 w-4 mr-1.5" /> Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Logout
              </button>
            </div>
          )}

          {!loading && mode === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger
                asChild
                aria-label="Admin menu"
              >
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Link>
              </DropdownMenuTrigger>
              <DropdownMenuItem asChild>
                <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin/categories" onClick={() => setUserMenuOpen(false)}>
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

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className="border-t border-border bg-background lg:hidden animate-slide-up"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="mx-auto flex max-w-7xl flex-col px-2 py-3">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-md px-3 py-3 text-sm font-medium",
                  isActive(l.to) ? "bg-muted text-foreground" : "text-muted-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
            {mode === "guest" ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-primary" aria-label="Login">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-primary-foreground" style={{ background: "var(--gradient-hero)" }} aria-label="Get Started">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {mode === "user" && (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-primary flex items-center gap-2" aria-label="Dashboard">
                    <User className="h-4 w-4" /> Dashboard
                  </Link>
                )}
                {mode === "admin" && (
                  <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-primary flex items-center gap-2" aria-label="Admin Dashboard">
                    <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { setMobileOpen(false); handleSignOut(); }}
                  className="rounded-md px-3 py-3 text-left text-sm font-medium text-muted-foreground flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}

      {/* User avatar dropdown for desktop */}
      {!loading && mode === "user" && (
        <DropdownMenu className="lg:block hidden">
          <DropdownMenuTrigger asChild aria-label="User menu">
            <button
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8" fallback={user?.name || "U"} />
              <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}>
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/bookmarks" onClick={() => setUserMenuOpen(false)}>
              <User className="h-4 w-4 mr-2" />
              Bookmarks
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenu>
      )}
    </header>
  );
}