import { Link } from "react-router-dom";
import { categories } from "../../lib/data";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-hero)" }}
            >
              L
            </span>
            <span>LearnHub</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            One Search. All Knowledge. Zero Cost. Built for learners. Powered by community.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/search" className="hover:text-foreground">Search</Link></li>
            <li><Link to="/categories" className="hover:text-foreground">Categories</Link></li>
            <li><Link to="/share" className="hover:text-foreground">Share a Resource</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Community</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/team" className="hover:text-foreground">Team</Link></li>
            <li><Link to="/feedback" className="hover:text-foreground">Feedback</Link></li>
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/support" className="hover:text-foreground">Support us</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Legal</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
            <li><Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link></li>
            <li><Link to="/support" className="hover:text-foreground">Support</Link></li>
          </ul>
          <h3 className="mt-6 text-sm font-semibold text-foreground">Top categories</h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link to={`/categories/${c.slug}`} className="hover:text-foreground">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          &copy; {new Date().getFullYear()} LearnHub &middot; Built for learners. Powered by community.
        </div>
      </div>
    </footer>
  );
}
