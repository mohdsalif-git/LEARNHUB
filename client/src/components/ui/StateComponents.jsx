import { cn } from "../../lib/utils";
import { Search, FileText, Users, Heart, Star, Mail, BookOpen, FolderOpen, AlertCircle, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./Button";

const emptyStateIcons = {
  search: Search,
  resources: FileText,
  users: Users,
  feedback: Heart,
  favorites: Star,
  email: Mail,
  content: BookOpen,
  categories: FolderOpen,
  default: FileText,
};

const emptyStateMessages = {
  search: {
    title: "No results found",
    description: "Try adjusting your search or filters to find what you're looking for.",
    action: { label: "Clear filters", variant: "ghost" },
  },
  resources: {
    title: "No resources yet",
    description: "Be the first to contribute a learning resource to this category.",
    action: { label: "Share a resource", variant: "primary", href: "/share" },
  },
  users: {
    title: "No members found",
    description: "No users match your current filters.",
    action: { label: "Clear filters", variant: "ghost" },
  },
  feedback: {
    title: "No feedback yet",
    description: "Share your experience to help improve the platform.",
    action: { label: "Give feedback", variant: "primary", href: "/feedback" },
  },
  favorites: {
    title: "No bookmarks yet",
    description: "Save resources to find them here later.",
    action: { label: "Explore resources", variant: "primary", href: "/search" },
  },
  content: {
    title: "No content available",
    description: "There's nothing to display right now.",
  },
  categories: {
    title: "No categories found",
    description: "Try adjusting your search or create a new category.",
    action: { label: "Add category", variant: "primary", href: "/admin/categories" },
  },
  default: {
    title: "Nothing here",
    description: "No items to display.",
  },
};

export function EmptyState({ type = "default", title, description, action, icon, className, size = "md" }) {
  const config = emptyStateMessages[type] || emptyStateMessages.default;
  const Icon = icon || emptyStateIcons[type] || emptyStateIcons.default;

  const sizeClasses = {
    sm: "py-6",
    md: "py-12",
    lg: "py-16",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("text-center", sizeClasses[size], className)}>
      <Icon className={cn("mx-auto text-muted-foreground", iconSizes[size])} />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title || config.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description || config.description}</p>
      {action && (
        <Button
          variant={config.action?.variant || action.variant || "primary"}
          className="mt-4"
          asChild={!!action.href}
        >
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            <button type="button" onClick={action.onClick}>{action.label}</button>
          )}
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ type = "spinner", size = "md", className, text }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  if (type === "spinner") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  if (type === "dots") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "rounded-full bg-primary animate-bounce",
              { "h-1.5 w-1.5": size === "sm", "h-2 w-2": size === "md", "h-3 w-3": size === "lg" }
            )}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  if (type === "bar") {
    return (
      <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
        <div className="absolute inset-0 bg-primary animate-shimmer" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry, className, size = "md" }) {
  const sizeClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card text-center", sizeClasses[size], className)}>
      <XCircle className={cn("mx-auto text-destructive", iconSizes[size])} />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description || "An unexpected error occurred. Please try again."}</p>
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <Loader2 className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

export function SuccessState({ title = "Success!", description, action, className, size = "md" }) {
  const sizeClasses = {
    sm: "py-4",
    md: "py-8",
    lg: "py-12",
  };

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("rounded-xl border border-border bg-card text-center", sizeClasses[size], className)}>
      <CheckCircle className={cn("mx-auto text-success", iconSizes[size])} />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button className="mt-4" asChild={!!action.href} onClick={action.onClick}>
          {action.href ? <a href={action.href}>{action.label}</a> : <button type="button">{action.label}</button>}
        </Button>
      )}
    </div>
  );
}