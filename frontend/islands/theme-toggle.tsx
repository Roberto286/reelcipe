import { useEffect, useState } from "preact/hooks";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("nord");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div class="flex items-center gap-2">
      <span class="text-sm">🌞</span>
      <input
        type="checkbox"
        class="toggle"
        checked={theme === "night"}
        onChange={() => setTheme(theme === "nord" ? "night" : "nord")}
      />
      <span class="text-sm">🌙</span>
    </div>
  );
}
