import { Chart } from "chart.js";

// Colores de texto y cuadrícula de los gráficos según el modo claro/oscuro
// del sistema, igual que las clases `dark:` de Tailwind (darkMode: "media").
// Sin esto, el texto gris por defecto de Chart.js casi no se ve sobre fondo oscuro.
const THEMES = {
  light: { color: "#4b5563", borderColor: "rgba(0,0,0,0.08)" }, // gray-600
  dark: { color: "#d1d5db", borderColor: "rgba(255,255,255,0.12)" }, // gray-300
};

const applyTheme = (dark) => {
  const theme = THEMES[dark ? "dark" : "light"];
  Chart.defaults.color = theme.color;
  Chart.defaults.borderColor = theme.borderColor;
  Chart.defaults.scale.grid.color = theme.borderColor;
  // Redibuja los gráficos ya montados con los colores nuevos
  Object.values(Chart.instances).forEach((chart) => chart.update("none"));
};

const media =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

applyTheme(Boolean(media?.matches));
media?.addEventListener("change", (e) => applyTheme(e.matches));
