import { IconMoon, IconSun } from "./Icons";
import { useTheme } from "../lib/theme";

export function ThemeToggle() {
  const { mode, toggle } = useTheme();
  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {mode === "dark" ? <IconSun /> : <IconMoon />}
      <span>{mode === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}
