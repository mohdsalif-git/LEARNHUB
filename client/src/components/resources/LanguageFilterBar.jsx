import React from "react";

const LANGUAGES = [
  { code: "all", label: "🌐 All Languages" },
  { code: "English", label: "English" },
  { code: "Hindi", label: "हिंदी (Hindi)" },
  { code: "Spanish", label: "Español (Spanish)" },
  { code: "French", label: "Français (French)" },
  { code: "German", label: "Deutsch (German)" },
  { code: "Tamil", label: "தமிழ் (Tamil)" },
  { code: "Telugu", label: "తెలుగు (Telugu)" },
  { code: "Bengali", label: "বাংলা (Bengali)" },
  { code: "Arabic", label: "العربية (Arabic)" },
  { code: "Japanese", label: "日本語 (Japanese)" },
  { code: "Chinese", label: "中文 (Chinese)" },
  { code: "Russian", label: "Русский (Russian)" },
];

/**
 * Plug-and-play Language Filter Bar component.
 * Non-destructive: consumes only props and emits onLanguageChange.
 */
export default function LanguageFilterBar({ selectedLanguage = "all", onLanguageChange }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
      {LANGUAGES.map((lang) => {
        const isActive =
          selectedLanguage === lang.code ||
          (lang.code === "all" && (!selectedLanguage || selectedLanguage === "all"));

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onLanguageChange && onLanguageChange(lang.code)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              isActive
                ? "bg-primary text-white shadow-sm ring-2 ring-primary/20"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-hover border border-border/40"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

