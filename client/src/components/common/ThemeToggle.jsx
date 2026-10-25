import { Sun, Moon, Monitor, Check } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/DropdownMenu";
import { cn } from "../../lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className, align = "end" }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <DropdownMenu align={align}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-xl",
            "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "transition-colors duration-150",
            className
          )}
          aria-label={`Current theme: ${theme}. Click to change theme.`}
          title={`Theme: ${theme}`}
        >
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 transition-transform duration-200" aria-hidden="true" />
          ) : (
            <Sun className="h-4 w-4 transition-transform duration-200" aria-hidden="true" />
          )}
          <span className="sr-only">Toggle theme (current: {theme})</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-36" align={align}>
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center justify-between cursor-pointer",
                isSelected && "font-semibold text-primary"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{opt.label}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Mobile-friendly inline theme selector for mobile navigation drawers
 */
export function MobileThemeSelector({ className }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={cn("flex flex-col gap-1.5 py-1", className)}>
      <span className="text-xs font-semibold text-muted-foreground px-1">Theme</span>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/50 p-1 border border-border">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all duration-150 min-h-[36px]",
                isSelected
                  ? "bg-card text-foreground shadow-xs border border-border/80 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              aria-pressed={isSelected}
              aria-label={`Switch to ${opt.label} theme`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
