"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all duration-200 group"
      title={dark ? "Mode clair" : "Mode sombre"}
    >
      {dark ? (
        <Sun className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12" />
      )}
    </button>
  );
}
