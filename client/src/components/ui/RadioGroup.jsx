"use client";

import { forwardRef, createContext, useContext, useState } from "react";
import { cn } from "../../lib/utils";

const RadioGroupContext = createContext(null);

function useRadioGroupContext() {
  const context = useContext(RadioGroupContext);
  if (!context) throw new Error("RadioGroup components must be used within RadioGroup.Root");
  return context;
}

export function RadioGroup({ children, value, onValueChange, defaultValue, disabled, name, ...props }) {
  const [selectedValue, setSelectedValue] = useState(value ?? defaultValue ?? "");
  const controlled = value !== undefined;

  const handleChange = (newValue) => {
    if (!controlled) setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <RadioGroupContext.Provider value={{ value: selectedValue, onValueChange: handleChange, disabled, name }}>
      <div role="radiogroup" aria-disabled={disabled} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export const RadioGroupItem = forwardRef(({ className, value, disabled, ...props }, ref) => {
  const { value: groupValue, onValueChange, disabled: groupDisabled, name } = useRadioGroupContext();
  const checked = groupValue === value;
  const isDisabled = disabled || groupDisabled;

  return (
    <input
      ref={ref}
      type="radio"
      name={name}
      value={value}
      checked={checked}
      disabled={isDisabled}
      onChange={() => !isDisabled && onValueChange(value)}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-full border border-input bg-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
        "data-[state=unchecked]:bg-background data-[state=unchecked]:text-foreground",
        className
      )}
      {...props}
    />
  );
});

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup as RadioGroupRoot };