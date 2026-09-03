import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const badgeVariants = {
  base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  variants: {
    default: "border border-border bg-transparent hover:bg-muted",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    success: "bg-success text-success-foreground hover:bg-success/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    info: "bg-info text-info-foreground hover:bg-info/90",
    outline: "border border-border bg-transparent",
    subtle: "bg-muted text-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
  },
};

function getBadgeClasses({ variant = "default", className }) {
  return cn(badgeVariants.base, badgeVariants.variants[variant], className);
}

export const Badge = forwardRef(
  ({ className, variant, children, ...props }, ref) => (
    <span ref={ref} className={getBadgeClasses({ variant, className })} {...props}>
      {children}
    </span>
  )
);

Badge.displayName = "Badge";

export const BadgeDot = forwardRef(({ className, variant = "default", ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
      {
        "bg-primary/10 text-primary": variant === "primary",
        "bg-secondary/10 text-secondary-foreground": variant === "secondary",
        "bg-destructive/10 text-destructive": variant === "destructive",
        "bg-success/10 text-success": variant === "success",
        "bg-warning/10 text-warning": variant === "warning",
        "bg-info/10 text-info": variant === "info",
        "bg-muted text-foreground": variant === "default",
      },
      className
    )}
    {...props}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    <span>{props.children}</span>
  </span>
));

BadgeDot.displayName = "BadgeDot";