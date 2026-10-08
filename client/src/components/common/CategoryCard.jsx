import { Link } from "react-router-dom";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "../../lib/utils";

export function CategoryCard({ category, className, ...props }) {
  const { slug, name, icon, color, courseCount } = category;

  // Fallback pastel background if not provided
  const iconBg = color
    ? `color-mix(in oklab, ${color} 15%, transparent)`
    : "var(--primary-subtle)";
  const iconColor = color || "var(--primary)";

  return (
    <Link
      to={`/categories/${slug}`}
      className={cn(
        "group inline-flex items-center gap-3.5 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] shrink-0 whitespace-nowrap select-none",
        className
      )}
      {...props}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform group-hover:scale-105"
        style={{
          background: iconBg,
          color: iconColor,
        }}
      >
        <CategoryIcon icon={icon} sizePx={20} />
      </span>
      <div className="flex flex-col text-left">
        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
          {name}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          {/* Always show the real count, including 0. Never fall back to a fake number. */}
          {typeof courseCount === "number" ? `${courseCount} course${courseCount !== 1 ? "s" : ""}` : "0 courses"}
        </span>
      </div>
    </Link>
  );
}

