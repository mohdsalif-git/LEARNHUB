import { Link } from "react-router-dom";
import { CategoryIcon } from "./CategoryIcon";
import { cn } from "../../lib/utils";

export function CategoryCard({ category, className, ...props }) {
  const { slug, name, icon, color, courseCount } = category;

  // Build a rich gradient from the category color
  const baseColor = color || "hsl(258 90% 60%)";
  const iconBg = color
    ? `linear-gradient(135deg, ${color}25, ${color}12)`
    : "linear-gradient(135deg, hsl(258 90% 60% / 0.15), hsl(258 90% 60% / 0.08))";
  const iconBorder = color
    ? `${color}30`
    : "hsl(258 90% 60% / 0.2)";
  const iconColor = color || "hsl(258 90% 60%)";

  return (
    <Link
      to={`/categories/${slug}`}
      className={cn(
        "group inline-flex items-center gap-3.5 rounded-2xl border border-border bg-white",
        "px-4 py-3.5 shadow-[var(--shadow-card)]",
        "transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)] hover:border-primary/25",
        "shrink-0 whitespace-nowrap select-none",
        className
      )}
      {...props}
    >
      {/* Icon container */}
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-md"
        style={{
          background: iconBg,
          border: `1px solid ${iconBorder}`,
          color: iconColor,
        }}
      >
        <CategoryIcon icon={icon} sizePx={20} />
      </span>

      <div className="flex flex-col text-left">
        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200" style={{ fontFamily: "var(--font-display)" }}>
          {name}
        </span>
        <span className="text-xs text-muted-foreground font-medium mt-0.5">
          {typeof courseCount === "number"
            ? `${courseCount} course${courseCount !== 1 ? "s" : ""}`
            : "0 courses"}
        </span>
      </div>
    </Link>
  );
}
