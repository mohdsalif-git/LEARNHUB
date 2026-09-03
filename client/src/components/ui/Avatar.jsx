import { forwardRef, useState } from "react";
import { cn } from "../../lib/utils";

export const Avatar = forwardRef(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const sizeClasses = {
      xs: "h-6 w-6 text-xs",
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10 text-base",
      lg: "h-12 w-12 text-lg",
      xl: "h-16 w-16 text-xl",
      "2xl": "h-20 w-20 text-2xl",
    };

    const [imageError, setImageError] = useState(false);

    if (!src || imageError) {
      const initials = fallback
        ? fallback
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "?";

      return (
        <div
          ref={ref}
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {initials}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full", className)}
        {...props}
      >
        <img
          src={src}
          alt={alt || ""}
          className={cn("aspect-square h-full w-full object-cover", sizeClasses[size])}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export const AvatarImage = forwardRef(({ className, ...props }, ref) => (
  <img ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
));

AvatarImage.displayName = "AvatarImage";

export const AvatarFallback = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted font-medium",
      className
    )}
    {...props}
  />
));

AvatarFallback.displayName = "AvatarFallback";

export const AvatarGroup = forwardRef(({ className, children, max = 4, size = "md", ...props }, ref) => {
  const sizeSpacing = {
    xs: "-space-x-1",
    sm: "-space-x-1.5",
    md: "-space-x-2",
    lg: "-space-x-2.5",
    xl: "-space-x-3",
  };

  const visibleChildren = Array.from(children).slice(0, max);
  const remainingCount = Array.from(children).length - max;

  return (
    <div ref={ref} className={cn("flex items-center", sizeSpacing[size], className)} {...props}>
      {visibleChildren.map((child, index) => (
        <span key={index} className="relative z-[calc(100-index)]">
          {child}
        </span>
      ))}
      {remainingCount > 0 && (
        <Avatar size={size} fallback={remainingCount > 9 ? "9+" : remainingCount} className="bg-muted/50" />
      )}
    </div>
  );
});

AvatarGroup.displayName = "AvatarGroup";