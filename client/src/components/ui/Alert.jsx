import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

const alertVariants = {
  default: "bg-card text-card-foreground border-border",
  destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  success: "border-success/50 text-success dark:border-success [&>svg]:text-success",
  warning: "border-warning/50 text-warning dark:border-warning [&>svg]:text-warning",
  info: "border-info/50 text-info dark:border-info [&>svg]:text-info",
};

export function Alert({ className, variant = "default", children, ...props }) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
        alertVariants[variant],
        className
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, children, ...props }) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props}>
      {children}
    </h5>
  );
}

export function AlertDescription({ className, children, ...props }) {
  return (
    <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
      {children}
    </div>
  );
}