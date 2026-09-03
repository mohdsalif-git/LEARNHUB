import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const buttonVariants = {
  base: "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  variants: {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
    outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
    subtle: "bg-muted text-foreground hover:bg-muted/80",
    success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm",
  },
  sizes: {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 rounded-md px-3 text-xs",
    lg: "h-11 rounded-lg px-8 text-base",
    xl: "h-12 rounded-lg px-10 text-lg",
    icon: "h-10 w-10",
    iconSm: "h-8 w-8",
    iconLg: "h-12 w-12",
  },
  loading: "relative pointer-events-none",
};

function getButtonClasses({ variant = "primary", size = "default", className, loading }) {
  const base = buttonVariants.base;
  const variantClass = buttonVariants.variants[variant];
  const sizeClass = buttonVariants.sizes[size];
  const loadingClass = loading ? buttonVariants.loading : "";
  return cn(base, variantClass, sizeClass, loadingClass, className);
}

export const Button = forwardRef(
  ({ className, variant, size, children, asChild = false, loading = false, disabled, ...props }, ref) => {
    const Component = asChild ? "span" : "button";
    const isDisabled = disabled || loading;
    
    return (
      <Component
        ref={ref}
        className={getButtonClasses({ variant, size, className, loading })}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </Component>
    );
  }
);

Button.displayName = "Button";

export const ButtonGroup = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex items-center gap-2", className)} {...props}>
    {children}
  </div>
));

ButtonGroup.displayName = "ButtonGroup";