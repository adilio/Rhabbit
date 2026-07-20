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
  mode: "dark" | "light";
  setPref: (p: ThemePref) => void;
  toggle: () => void;
}>({ pref: "system", mode: "light", setPref: () => {}, toggle: () => {} });

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
    ?.setAttribute("content", mode === "light" ? "#fcfaf5" : "#1f1b18");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(
    () => (localStorage.getItem(STORAGE_KEY) as ThemePref) || "system",
  );
  const [mode, setMode] = useState<"dark" | "light">(() => resolve(pref));

  useEffect(() => {
    apply(pref);
    setMode(resolve(pref));
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      if (pref === "system") {
        apply(pref);
        setMode(resolve(pref));
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  const setPref = (p: ThemePref) => {
    localStorage.setItem(STORAGE_KEY, p);
    setPrefState(p);
  };

  const toggle = () => setPref(mode === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ pref, mode, setPref, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
