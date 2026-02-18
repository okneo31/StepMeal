"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface ThemeContextType {
  theme: string;
  setTheme: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "default",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState("default");

  // On mount: read from localStorage immediately to prevent FOUC
  useEffect(() => {
    const stored = localStorage.getItem("stepmeal-theme");
    if (stored && stored !== "default") {
      document.documentElement.setAttribute("data-theme", stored);
      setThemeState(stored);
    }

    // Sync from API
    fetch("/api/user/theme")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.activeTheme && data.activeTheme !== (stored || "default")) {
          const serverTheme = data.activeTheme;
          if (serverTheme === "default") {
            document.documentElement.removeAttribute("data-theme");
          } else {
            document.documentElement.setAttribute("data-theme", serverTheme);
          }
          localStorage.setItem("stepmeal-theme", serverTheme);
          setThemeState(serverTheme);
        }
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((id: string) => {
    if (id === "default") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", id);
    }
    localStorage.setItem("stepmeal-theme", id);
    setThemeState(id);

    // Persist to API
    fetch("/api/user/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeId: id }),
    }).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
