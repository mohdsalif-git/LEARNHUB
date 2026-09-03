"use client";

import { forwardRef, useState, useCallback, createContext, useContext } from "react";
import { cn } from "../../lib/utils";

const TabsContext = createContext(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs primitives must be used within Tabs.Root");
  return context;
}

export function Tabs({ children, defaultValue, value, onValueChange, className, ...props }) {
  const [activeValue, setActiveValue] = useState(defaultValue);
  const controlled = value !== undefined;

  const handleChange = useCallback((newValue) => {
    if (!controlled) setActiveValue(newValue);
    onValueChange?.(newValue);
  }, [controlled, onValueChange]);

  const currentValue = controlled ? value : activeValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn(className)} data-value={currentValue} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export const TabsList = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    role="tablist"
    aria-orientation="horizontal"
    {...props}
  >
    {children}
  </div>
));

TabsList.displayName = "TabsList";

export const TabsTrigger = forwardRef(({ className, value, disabled, children, ...props }, ref) => {
  const { value: activeValue, onValueChange } = useTabsContext();

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={activeValue === value}
      aria-disabled={disabled}
      data-state={activeValue === value ? "active" : "inactive"}
      data-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        activeValue === value
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = forwardRef(({ className, value, forceMount, children, ...props }, ref) => {
  const { value: activeValue } = useTabsContext();

  if (!forceMount && activeValue !== value) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      role="tabpanel"
      aria-labelledby={`tabs-${value}-trigger`}
      {...props}
    >
      {children}
    </div>
  );
});

TabsContent.displayName = "TabsContent";

export { Tabs as TabsRoot };