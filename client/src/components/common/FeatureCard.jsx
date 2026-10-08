import { CategoryIcon } from "./CategoryIcon";
import { cn } from "../../lib/utils";

export function FeatureCard({ icon, title, description, className, ...props }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] min-w-[280px] max-w-[340px] shrink-0",
        className
      )}
      {...props}
    >
      <div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {typeof icon === "string" ? (
            <CategoryIcon icon={icon} sizePx={22} />
          ) : (
            icon
          )}
        </div>
        <h3 className="mt-4 text-base font-bold text-foreground tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </article>
  );
}
