import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Card = forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground transition-colors duration-150",
      {
        "border-border shadow-[var(--shadow-card)]": variant === "default",
        "border-border/50 shadow-[var(--shadow-elevated)]": variant === "elevated",
        "border-transparent bg-muted/50": variant === "subtle",
        "border-destructive/20 bg-destructive/5": variant === "destructive",
        "border-success/20 bg-success/5": variant === "success",
        "border-warning/20 bg-warning/5": variant === "warning",
        "border-primary/20 bg-primary/5": variant === "primary",
        "border-2 border-border shadow-none": variant === "outlined",
      },
      className
    )}
    {...props}
  />
));

Card.displayName = "Card";

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));

CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));

CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));

CardDescription.displayName = "CardDescription";

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));

CardContent.displayName = "CardContent";

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));

CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };