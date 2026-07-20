import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemePref = "system" | "dark" | "light";

const ThemeContext = createContext<{
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}>({ pref: "system", setPref: () => {} });

const STORAGE_KEY = "rhabbit-theme";

function resolve(pref: ThemePref): "dark" | "light" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function apply(pref: ThemePref) {
  const mode = resolve(pref);
  document.documentElement.dataset.theme = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "light" ? "#f7f4ee" : "#0b0d12");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePref) || "system",
  );

  useEffect(() => {
    apply(pref);
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => pref === "system" && apply(pref);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setPref = (p: ThemePref) => {
    localStorage.setItem(STORAGE_KEY, p);
    setPrefState(p);
  };

  return (
    <ThemeContext.Provider value={{ pref, setPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
