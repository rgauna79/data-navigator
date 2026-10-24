// Registra los elementos de Chart.js que usa la app y aplica los colores del
// modo claro/oscuro. Importar este módulo antes de dibujar un gráfico.
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Filler,
} from "chart.js";
import "./chartTheme.js";
import { createTranslator } from "../i18n/I18nContext.jsx";

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Title, Filler
);

// Números de los ejes y las etiquetas en el formato del idioma elegido
// (1.234,5 en español). El idioma se lee del atributo lang de la página.
const applyLocale = () => {
  ChartJS.defaults.locale = createTranslator(document.documentElement.lang).locale;
  Object.values(ChartJS.instances).forEach((chart) => chart.update("none"));
};
if (typeof document !== "undefined") {
  applyLocale();
  new MutationObserver(applyLocale).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
}
