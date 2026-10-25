import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";

const STORAGE_KEY = "learnhub-theme";
const THEMES = ["light", "dark", "system"];

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => { },
});

function getInitialTheme() {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && THEMES.includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage might be unavailable/blocked
  }
  return "system";
}

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Compute the resolved active theme (light or dark)
  const resolvedTheme = useMemo(() => {
    return theme === "system" ? systemTheme : theme;
  }, [theme, systemTheme]);

  // Listen to OS prefers-color-scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme class to <html> with smooth transition helper
  useEffect(() => {
    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";

    // Enable smooth transition if user doesn't prefer reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!prefersReducedMotion) {
      root.classList.add("theme-transition");
    }

    if (isDark) {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }

    let timeoutId;
    if (!prefersReducedMotion) {
      timeoutId = setTimeout(() => {
        root.classList.remove("theme-transition");
      }, 250);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [resolvedTheme]);

  // Persist theme selection in localStorage
  const setTheme = useCallback((newTheme) => {
    if (!THEMES.includes(newTheme)) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (err) {
      console.warn("Failed to save theme in localStorage:", err);
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
