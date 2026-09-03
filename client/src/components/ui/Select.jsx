import React, { createContext, useContext, forwardRef, useId, useState, useCallback, useEffect, useRef } from "react";
import { cn } from "../../lib/utils";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

const SelectContext = createContext(null);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) throw new Error("Select components must be used within Select.Root");
  return context;
}

export function Select({ children, value, onValueChange, defaultValue, disabled, className, ...props }) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value ?? defaultValue ?? "");
  const triggerRef = useRef(null);
  const contentRef = useRef(null);
  const controlled = value !== undefined;

  const handleValueChange = useCallback((newValue) => {
    if (!controlled) setSelectedValue(newValue);
    onValueChange?.(newValue);
    setOpen(false);
  }, [controlled, onValueChange]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (triggerRef.current && !triggerRef.current.contains(event.target)) {
        if (contentRef.current && !contentRef.current.contains(event.target)) {
          setOpen(false);
        }
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentVal = controlled ? value : selectedValue;

  return (
    <SelectContext.Provider value={{ value: currentVal, onValueChange: handleValueChange, open, setOpen, disabled, triggerRef, contentRef }}>
      <div className={cn("relative w-full", disabled && "opacity-50 pointer-events-none", className)} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export const SelectTrigger = forwardRef(({ className, children, placeholder, ...props }, ref) => {
  const { value, open, disabled, triggerRef, setOpen } = useSelectContext();

  return (
    <button
      ref={(el) => {
        if (ref) {
          if (typeof ref === "function") ref(el);
          else ref.current = el;
        }
        triggerRef.current = el;
      }}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={() => !disabled && setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-150",
        className
      )}
      {...props}
    >
      <span className="truncate flex-1 text-left">
        {children || (value ? value : <span className="text-muted-foreground">{placeholder}</span>)}
      </span>
      {open ? <ChevronUp className="h-4 w-4 opacity-50 shrink-0 ml-2" /> : <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />}
    </button>
  );
});

SelectTrigger.displayName = "SelectTrigger";

export const SelectValue = forwardRef(({ className, placeholder, ...props }, ref) => {
  const { value } = useSelectContext();
  return (
    <span ref={ref} className={cn("truncate", !value && "text-muted-foreground", className)} {...props}>
      {value || placeholder}
    </span>
  );
});

SelectValue.displayName = "SelectValue";

export const SelectContent = ({ children, className, ...props }) => {
  const { open, contentRef } = useSelectContext();

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-y-auto rounded-lg border border-border bg-card p-1 text-card-foreground shadow-[var(--shadow-dropdown)] animate-slide-up",
        className
      )}
      role="listbox"
      aria-orientation="vertical"
      {...props}
    >
      {children}
    </div>
  );
};

export const SelectItem = forwardRef(({ className, value, disabled, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = useSelectContext();
  const selected = selectedValue === value;

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      data-value={value}
      data-disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        selected && "bg-accent text-accent-foreground",
        className
      )}
      {...props}
    >
      {selected && <Check className="mr-2 h-4 w-4" />}
      {children}
    </div>
  );
});

SelectItem.displayName = "SelectItem";

export const SelectGroup = ({ children, label, className, ...props }) => (
  <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props}>
    {label && <div className="mb-1">{label}</div>}
    <div role="group">{children}</div>
  </div>
);

export const SelectLabel = ({ children, className, ...props }) => (
  <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props}>
    {children}
  </div>
);

export const SelectSeparator = ({ className, ...props }) => (
  <div className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />
);

export const SelectScrollUpButton = ({ className, ...props }) => (
  <button
    type="button"
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </button>
);

export const SelectScrollDownButton = ({ className, ...props }) => (
  <button
    type="button"
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </button>
);

export { Select as SelectRoot };