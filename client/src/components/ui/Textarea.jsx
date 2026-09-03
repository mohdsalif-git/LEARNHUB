import { forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

export const Textarea = forwardRef(
  ({ className, error, label, disabled, required, placeholder, helpText, ...props }, ref) => {
    const textareaId = props.id || useId();
    const errorId = error ? `${textareaId}-error` : undefined;
    const helpId = helpText ? `${textareaId}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            id={textareaId}
            className={cn(
              "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-150 resize-y",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            placeholder={placeholder}
            {...props}
          />
          {error && (
            <span className="absolute -bottom-5 left-0 text-xs text-destructive" id={errorId} role="alert">
              {error}
            </span>
          )}
        </div>
        {helpText && !error && (
          <p id={helpId} className="mt-1.5 text-xs text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";