import { Link } from "react-router-dom";
import { categories } from "../../lib/data";
import { Github, Twitter, Youtube, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { href: "https://github.com", icon: Github, label: "GitHub" },
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://youtube.com", icon: Youtube, label: "YouTube" },
    { href: "mailto:hello@learnhub.dev", icon: Mail, label: "Email" },
  ];

  return (
    <footer className="border-t border-border bg-muted/30" role="contentinfo">
      <div className="mx-auto grid max-w-7xl gap-8 md:gap-12 px-4 py-10 sm:px-6 lg:grid-cols-5 lg:py-14">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
              aria-hidden="true"
            >
              L
            </span>
            <span>LearnHub</span>
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
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Explore</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground" role="list">
            <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
            <li><Link to="/search" className="hover:text-foreground transition-colors">Search Resources</Link></li>
            <li><Link to="/categories" className="hover:text-foreground transition-colors">Categories</Link></li>
            <li><Link to="/share" className="hover:text-foreground transition-colors">Share a Resource</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Community</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground" role="list">
            <li><Link to="/team" className="hover:text-foreground transition-colors">Team</Link></li>
            <li><Link to="/feedback" className="hover:text-foreground transition-colors">Feedback</Link></li>
            <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
            <li><Link to="/support" className="hover:text-foreground transition-colors">Support Us</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground">Legal</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground" role="list">
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            <li><Link to="/refund-policy" className="hover:text-foreground transition-colors">Refund Policy</Link></li>
          </ul>
          <h3 className="mt-8 text-sm font-semibold text-foreground">Top Categories</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-muted-foreground" role="list">
            {categories.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link to={`/categories/${c.slug}`} className="hover:text-foreground transition-colors truncate">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          &copy; {currentYear} LearnHub &middot; Built for learners. Powered by community.
        </div>
      </div>
    </footer>
  );
}