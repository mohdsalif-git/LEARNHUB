"use client";

import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { Check } from "lucide-react";

export const Checkbox = forwardRef(({ className, disabled, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    disabled={disabled}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-input bg-background",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
      "data-[state=unchecked]:bg-background data-[state=unchecked]:text-foreground",
      className
    )}
    {...props}
  />
));

Checkbox.displayName = "Checkbox";