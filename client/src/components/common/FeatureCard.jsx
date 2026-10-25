import { CategoryIcon } from "./CategoryIcon";
import { cn } from "../../lib/utils";

const ICON_COLOR_MAP = {
  "search":          { box: "icon-box-purple", gradient: "linear-gradient(135deg, #6C4EFF, #4DA3FF)" },
  "play":            { box: "icon-box-cyan",   gradient: "linear-gradient(135deg, #23D5E8, #4DA3FF)" },
  "book-open":       { box: "icon-box-pink",   gradient: "linear-gradient(135deg, #FF6B9D, #C44DFF)" },
  "share2":          { box: "icon-box-green",  gradient: "linear-gradient(135deg, #4CAF7D, #23D5E8)" },
  "message-square":  { box: "icon-box-orange", gradient: "linear-gradient(135deg, #FF9800, #FF5722)" },
  "zap":             { box: "icon-box-purple", gradient: "linear-gradient(135deg, #6C4EFF, #8C5DFF)" },
};

export function FeatureCard({ icon, title, description, className, ...props }) {
  const { box, gradient } = ICON_COLOR_MAP[icon] || { box: "icon-box-purple", gradient: "var(--gradient-hero)" };

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6",
        "shadow-[var(--shadow-card)] transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-[var(--shadow-float)] hover:border-primary/20",
        "min-w-[280px] max-w-[340px] shrink-0 cursor-default",
        className
      )}
      {...props}
    >
      {/* Top glow strip */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: gradient }}
        aria-hidden="true"
      />

      <div>
        {/* Icon with gradient background */}
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ background: gradient }}
        >
          {typeof icon === "string" ? (
            <CategoryIcon icon={icon} sizePx={22} />
          ) : icon}
        </div>

        <h3 className="text-base font-bold text-foreground tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Arrow link hint */}
      <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Learn more
        <svg className="h-3 w-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </article>
  );
}
