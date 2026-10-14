import { Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

export function SectionHeader({ id, eyebrow, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-10", className)}>
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="h-3 w-3" />
            {eyebrow}
          </span>
        )}
        <h2 id={id} className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
