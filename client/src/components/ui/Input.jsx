import { forwardRef, useId } from "react";
import { cn } from "../../lib/utils";

export const Input = forwardRef(
  ({ className, type, error, label, leftIcon, rightIcon, disabled, required, placeholder, helpText, ...props }, ref) => {
    const inputId = props.id || useId();
    const errorId = error ? `${inputId}-error` : undefined;
    const helpId = helpText ? `${inputId}-help` : undefined;
    const describedBy = [errorId, helpId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-150",
              error && "border-destructive focus-visible:ring-destructive",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={describedBy}
            placeholder={placeholder}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
              {rightIcon}
            </div>
          )}
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

Input.displayName = "Input";

export const InputGroup = forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex w-full items-center", className)} {...props}>
    {children}
  </div>
));

InputGroup.displayName = "InputGroup";