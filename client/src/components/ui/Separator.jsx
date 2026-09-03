import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export const Separator = forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <hr
    ref={ref}
    className={cn(
      "bg-border shrink-0",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    aria-orientation={orientation}
    role={decorative ? "none" : "separator"}
    {...props}
  />
));

Separator.displayName = "Separator";