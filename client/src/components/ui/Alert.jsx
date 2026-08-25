import { cn } from "@/lib/utils";

function Alert({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-background text-foreground border",
    destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  };
  return (
    <div role="alert" className={cn("relative w-full rounded-lg border p-4", variants[variant], className)} {...props} />
  );
}

function AlertTitle({ className, ...props }) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }) {
  return <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
