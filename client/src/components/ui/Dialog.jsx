import { useEffect, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

function Dialog({ open, onOpenChange, children, className }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const previousActiveElement = useRef(null);

  const handleEscape = useCallback(
    (event) => {
      if (event.key === "Escape" && onOpenChange) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      setTimeout(() => contentRef.current?.focus(), 0);
    } else {
      document.body.style.overflow = "";
      previousActiveElement.current?.focus?.();
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, handleEscape]);

  if (!open) return null;

  const portalTarget = document.getElementById("dialog-portal") || document.body;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={() => onOpenChange?.(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      <div
        ref={contentRef}
        tabIndex={-1}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-dropdown)] animate-slide-up",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    portalTarget
  );
}

function DialogTrigger({ children, onOpenChange }) {
  return (
    <button
      type="button"
      onClick={() => onOpenChange?.(true)}
      className="inline-flex items-center gap-1.5"
    >
      {children}
    </button>
  );
}

function DialogContent({ children, className, ...props }) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

function DialogHeader({ children, className }) {
  return <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>;
}

function DialogTitle({ children, className, id = "dialog-title" }) {
  return <h2 id={id} className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>;
}

function DialogDescription({ children, className }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

function DialogFooter({ children, className }) {
  return (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>
      {children}
    </div>
  );
}

function DialogClose({ children, onOpenChange, className, ...props }) {
  return (
    <button
      type="button"
      onClick={() => onOpenChange?.(false)}
      className={cn(
        "absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      {children || <X className="h-4 w-4" />}
    </button>
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose };