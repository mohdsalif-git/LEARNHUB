import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CategoryIcon } from "../common/CategoryIcon";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const guestLinks = [
    { to: "/", label: "Home" },
    { to: "/categories", label: "Categories" },
    { to: "/search", label: "Search" },
    { to: "/share", label: "Share Resource" },
  ];

  const userLinks = [
    { to: "/", label: "Home" },
    { to: "/categories", label: "Categories" },
    { to: "/search", label: "Search" },
    { to: "/bookmarks", label: "Saved" },
    { to: "/share", label: "Share Resource" },
    { to: "/feedback", label: "Feedback" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard", label: "Admin Dashboard" },
    { to: "/categories", label: "Categories" },
    { to: "/team", label: "Team" },
    { to: "/feedback", label: "Feedback" },
  ];

  const mode = !user ? "guest" : isAdmin ? "admin" : "user";
  const links = mode === "admin" ? adminLinks : mode === "user" ? userLinks : guestLinks;

  function handleSignOut() {
    logout();
    navigate("/");
  }

  function isActive(to) {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <CategoryIcon icon="graduation-cap" sizePx={16} className="text-white" />
          </span>
          <span className="text-lg">LearnHub</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(l.to)
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
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
              >
                Login
              </Link>
              <Link
                to="/admin/login"
                className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                Admin Login
              </Link>
            </>
          )}

          {!loading && mode === "user" && (
            <>
              <Link
                to="/dashboard"
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
              >
                Logout
              </button>
            </>
          )}

          {!loading && mode === "admin" && (
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Logout
            </button>
          )}

          {mode !== "admin" && (
            <Link
              to="/support"
              className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elevated)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
              style={{ background: "var(--gradient-hero)" }}
            >
              Support
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-2 py-2" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`rounded-md px-3 py-3 text-sm font-medium ${
                  isActive(l.to) ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
            {mode === "guest" ? (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-primary">
                  Login
                </Link>
                <Link to="/admin/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground">
                  Admin Login
                </Link>
              </>
            ) : (
              <>
                {mode === "user" && (
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium text-primary">
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { setOpen(false); handleSignOut(); }}
                  className="rounded-md px-3 py-3 text-left text-sm font-medium text-muted-foreground"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
