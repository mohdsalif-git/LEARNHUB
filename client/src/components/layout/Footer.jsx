import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { categoryService } from "../../services/categoryService";
import { Github, Twitter, Youtube, Mail, Coffee } from "lucide-react";
import { Logo } from "../common/Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [topCategories, setTopCategories] = useState([]);

  useEffect(() => {
    categoryService.getAll({ status: "active" })
      .then((res) => setTopCategories(res.data?.categories?.slice(0, 8) || []))
      .catch(() => setTopCategories([]));
  }, []);

  const socialLinks = [
    { href: "https://github.com", icon: Github, label: "GitHub" },
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://youtube.com", icon: Youtube, label: "YouTube" },
    { href: "mailto:hello@wingly.dev", icon: Mail, label: "Email" },
  ];

  return (
    <footer className="border-t border-border bg-muted/30" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        {/* ── Main footer grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.6fr]">

          {/* Brand column */}
          <div className="min-w-0 space-y-4">
            <div className="flex items-center">
              <Logo imgClassName="h-9 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              One Search. All Knowledge. Zero Cost. Built for learners. Powered by community.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={s.label}
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
            <div className="pt-2">
              <a
                href={import.meta.env.VITE_BUY_ME_A_COFFEE_URL || "https://buymeacoffee.com/wingly"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted hover:border-primary/40 transition-colors shadow-sm"
                aria-label="Support Wingly on Buy Me a Coffee"
              >
                <Coffee className="h-4 w-4 text-[color:var(--warning)]" />
                <span>Buy us a coffee</span>
              </a>
            </div>
          </div>

          {/* Explore column */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Explore</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground" role="list">
              <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
              <li><Link to="/search" className="hover:text-foreground transition-colors">Search Resources</Link></li>
              <li><Link to="/categories" className="hover:text-foreground transition-colors">Categories</Link></li>
              <li><Link to="/share" className="hover:text-foreground transition-colors">Share a Resource</Link></li>
            </ul>
          </div>

          {/* Community column */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Community</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground" role="list">
              <li><Link to="/team" className="hover:text-foreground transition-colors">Team</Link></li>
              <li><Link to="/feedback" className="hover:text-foreground transition-colors">Feedback</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/support" className="hover:text-foreground transition-colors">Support Us</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Legal + Top Categories column */}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground" role="list">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
            </ul>
            {topCategories.length > 0 && (
              <>
                <h3 className="mt-8 text-sm font-semibold text-foreground">Top Categories</h3>
                <ul
                  className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground"
                  role="list"
                >
                  {topCategories.map((c) => (
                    <li key={c.slug} className="min-w-0">
                      <Link
                        to={`/categories/${c.slug}`}
                        className="block truncate hover:text-foreground transition-colors"
                        title={c.name}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          &copy; {currentYear} Wingly &middot; Built for learners. Powered by community.
        </div>
      </div>
    </footer>
  );
}