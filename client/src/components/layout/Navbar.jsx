import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CategoryIcon } from "../common/CategoryIcon";
import {
  Menu, X, User, LogOut, LayoutDashboard,
  Settings, ChevronDown, Bookmark, Shield, Search,
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
import { ThemeToggle, MobileThemeSelector } from "../common/ThemeToggle";
import { Logo } from "../common/Logo";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, state, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileMenuRef = useRef(null);

  const isLoading = state === "initializing";
  const mode = !user || isLoading ? "guest" : isAdmin ? "admin" : "user";

  // Elevate navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Link sets ──────────────────────────────────────────────────────────
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
  const links = mode === "admin" ? adminLinks : mode === "user" ? userLinks : guestLinks;

  const handleSignOut = () => { logout(); navigate("/"); setMobileOpen(false); };
  const isActive = (to) => to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Focus trap in mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const menu = mobileMenuRef.current;
    if (!menu) return;
    const focusable = menu.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last?.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first?.focus(); } }
    };
    document.addEventListener("keydown", handleTab);
    first?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, [mobileOpen]);

  // ── Nav link class ──────────────────────────────────────────────────────
  const navLinkCls = (to) => cn(
    "relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
    isActive(to)
      ? "text-foreground bg-primary/8"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
  );

  // ── Mobile link class ───────────────────────────────────────────────────
  const mobileLinkCls = (to) => cn(
    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] transition-colors duration-150",
    isActive(to)
      ? "bg-primary/8 text-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
  );

  return (
    <header
      className="fixed inset-x-0 top-3 z-50 pointer-events-none"
      aria-label="Main header"
    >
      {/* ── Floating glass bar ─────────────────────────────────────────── */}
      <div className={cn(
        "mx-auto max-w-7xl px-4 sm:px-6 pointer-events-auto",
      )}>
        <div className={cn(
          "glass-strong rounded-2xl transition-all duration-300",
          scrolled
            ? "shadow-[0_8px_32px_hsl(258_90%_60%_/_0.08),0_2px_8px_hsl(220_14%_30%_/_0.08)]"
            : "shadow-[var(--shadow-glass)]"
        )}>
          <div className="flex h-14 items-center justify-between gap-4 px-5">

            {/* Logo */}
            <Logo priority={true} />

            {/* Desktop nav links */}
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {links.map((l) => (
                <Link
                  key={l.key}
                  to={l.to}
                  className={navLinkCls(l.to)}
                  aria-current={isActive(l.to) ? "page" : undefined}
                >
                  {l.label}
                  {/* Active indicator dot */}
                  {isActive(l.to) && (
                    <span
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full"
                      style={{ background: "var(--gradient-hero)" }}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right-side controls */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <ThemeToggle />

              {/* Search shortcut (desktop) */}
              <Link
                to="/search"
                className="hidden lg:flex items-center justify-center h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Link>

              {/* Guest CTA */}
              {!isLoading && mode === "guest" && (
                <>
                  <Link
                    to="/login"
                    className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/60 min-h-[36px]"
                    aria-label="Login"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm btn-glow min-h-[36px] transition-all"
                    style={{ background: "var(--gradient-hero)" }}
                    aria-label="Get Started"
                  >
                    Get Started
                  </Link>
                </>
              )}

              {/* Logged-in user dropdown (desktop ≥ lg) */}
              {!isLoading && mode === "user" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild aria-label="User menu">
                    <button
                      className="hidden lg:flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors min-h-[40px]"
                      aria-label="User menu"
                    >
                      <Avatar className="h-7 w-7" fallback={user?.name || "U"} />
                      <span className="text-sm font-medium max-w-[120px] truncate">{user?.name}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem asChild><Link to="/profile"><User className="h-4 w-4 mr-2" />Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/bookmarks"><Bookmark className="h-4 w-4 mr-2" />Saved Resources</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" />Logout</DropdownMenuItem>
                </DropdownMenu>
              )}

              {/* Admin dropdown (desktop ≥ lg) */}
              {!isLoading && mode === "admin" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild aria-label="Admin menu">
                    <button
                      className="hidden lg:flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors min-h-[40px]"
                      aria-label="Admin menu"
                    >
                      <Avatar className="h-7 w-7" fallback={user?.name || "A"} />
                      <span className="text-sm font-medium max-w-[120px] truncate">{user?.name}</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuLabel>Admin</DropdownMenuLabel>
                  <DropdownMenuItem asChild><Link to="/admin/dashboard"><LayoutDashboard className="h-4 w-4 mr-2" />Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/admin/categories"><Settings className="h-4 w-4 mr-2" />Categories</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}><LogOut className="h-4 w-4 mr-2" />Logout</DropdownMenuItem>
                </DropdownMenu>
              )}

              {/* Hamburger (mobile / tablet < lg) */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground lg:hidden min-h-[40px] min-w-[40px] transition-colors"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile drawer ──────────────────────────────────────────────── */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            ref={mobileMenuRef}
            className="glass-strong rounded-2xl mt-2 overflow-hidden animate-slide-up"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col px-3 py-3 gap-0.5">
              {/* User banner */}
              {!isLoading && mode !== "guest" && (
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3 mb-2">
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

              {links.map((l) => (
                <Link key={l.key} to={l.to} onClick={() => setMobileOpen(false)} className={mobileLinkCls(l.to)} aria-current={isActive(l.to) ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}

              <div className="my-1 border-t border-border/60" />

              {/* Mobile theme selector */}
              <div className="px-1 py-1">
                <MobileThemeSelector />
              </div>

              <div className="my-1 border-t border-border/60" />

              {/* Guest */}
              {mode === "guest" && (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] text-foreground hover:bg-muted/60">Login</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center justify-center rounded-xl px-3 py-3 text-sm font-semibold text-white min-h-[44px]" style={{ background: "var(--gradient-hero)" }}>Get Started</Link>
                </>
              )}

              {/* User */}
              {mode === "user" && (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"><User className="h-4 w-4 shrink-0" /> Profile</Link>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"><LayoutDashboard className="h-4 w-4 shrink-0" /> Dashboard</Link>
                  <button type="button" onClick={handleSignOut} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] text-destructive hover:bg-destructive/10 text-left w-full"><LogOut className="h-4 w-4 shrink-0" /> Logout</button>
                </>
              )}

              {/* Admin */}
              {mode === "admin" && (
                <>
                  <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"><LayoutDashboard className="h-4 w-4 shrink-0" /> Admin Dashboard</Link>
                  <Link to="/admin/categories" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted/60"><Settings className="h-4 w-4 shrink-0" /> Categories</Link>
                  <button type="button" onClick={handleSignOut} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium min-h-[44px] text-destructive hover:bg-destructive/10 text-left w-full"><LogOut className="h-4 w-4 shrink-0" /> Logout</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}