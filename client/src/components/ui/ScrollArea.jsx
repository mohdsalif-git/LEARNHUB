"use client";

import { forwardRef, useRef, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export function ScrollArea({ className, children, ...props }) {
  return (
    <div
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export const ScrollBar = forwardRef(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" ? "h-full w-2.5" : "h-2.5 w-full",
      className
    )}
    {...props}
  >
    <div className="relative flex-1 rounded-full bg-border/50" />
  </div>
));

ScrollBar.displayName = "ScrollBar";