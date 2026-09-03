import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";

const DropdownMenuContext = createContext(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenu components must be used within DropdownMenu.Root");
  return context;
}

function DropdownMenu({ children, className, align = "end" }) {
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const contextValue = {
    open,
    setOpen,
    disabled,
    setDisabled,
    triggerRef,
    contentRef,
  };

  const childArray = React.Children.toArray(children);
  const trigger = childArray.find((child) => child?.type === DropdownMenuTrigger);
  const hasExplicitContent = childArray.some((child) => child?.type === DropdownMenuContent);
  const menuItems = childArray.filter((child) => child?.type !== DropdownMenuTrigger);

  return (
    <DropdownMenuContext.Provider value={contextValue}>
      <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
        {trigger || childArray[0]}
        {open && (
          hasExplicitContent ? (
            menuItems
          ) : (
            <div
              ref={contentRef}
              className={cn(
                "absolute z-50 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-[var(--shadow-dropdown)] animate-slide-up",
                align === "end" ? "right-0" : "left-0"
              )}
              role="menu"
              aria-orientation="vertical"
            >
              {menuItems}
            </div>
          )
        )}
      </div>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ asChild, children, className, ...props }) {
  const { open, setOpen, disabled, triggerRef } = useDropdownMenuContext();

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!disabled) setOpen(!open);
  }, [open, disabled, setOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    }
  }, [setOpen, triggerRef]);

  const triggerProps = {
    ref: triggerRef,
    type: "button",
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    className: cn("inline-flex items-center gap-1", className),
    ariaHaspopup: "menu",
    ariaExpanded: open,
    ariaDisabled: disabled,
    disabled,
    ...props,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...triggerProps,
      ...children.props,
      className: cn(triggerProps.className, children.props.className),
      onClick: (e) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
      onKeyDown: (e) => {
        children.props.onKeyDown?.(e);
        handleKeyDown(e);
      },
    });
  }

  return (
    <button ref={triggerRef} {...triggerProps}>
      {children}
    </button>
  );
}

function DropdownMenuContent({ children, className, align = "end", ...props }) {
  const { open, contentRef } = useDropdownMenuContext();

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-1 min-w-[9rem] overflow-hidden rounded-lg border border-border bg-card p-1 text-card-foreground shadow-[var(--shadow-dropdown)] animate-slide-up",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      role="menu"
      aria-orientation="vertical"
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({ children, onClick, disabled, className, asChild, ...props }) {
  const { setOpen } = useDropdownMenuContext();

  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
    setOpen(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        children.props.className,
        className
      ),
      onClick: (e) => {
        children.props.onClick?.(e);
        handleClick(e);
      },
      role: "menuitem",
      tabIndex: -1,
    });
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuLabel({ children, className }) {
  return (
    <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}>
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

function DropdownMenuShortcut({ children, className }) {
  return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)}>{children}</span>;
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut };