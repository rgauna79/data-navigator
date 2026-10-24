// Rangos de fechas rápidos para filtrar (este mes, mes anterior...) y los
// meses o años que aparecen en una columna. Las fechas se devuelven como
// "YYYY-MM-DD", el formato de los filtros de la tabla.
import { tk } from "../i18n/tk.js";

const pad = (n) => String(n).padStart(2, "0");
export const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const range = (from, to) => ({ from: toInputDate(from), to: toInputDate(to) });
const endOfMonth = (y, m) => new Date(y, m + 1, 0);

export const DATE_PRESETS = {
  thisMonth: tk("This month"),
  lastMonth: tk("Last month"),
  thisQuarter: tk("This quarter"),
  lastQuarter: tk("Last quarter"),
  thisYear: tk("This year"),
  lastYear: tk("Last year"),
  last30: tk("Last 30 days"),
  last90: tk("Last 90 days"),
};

/** Rango { from, to } de un rango rápido respecto a la fecha de hoy. */
export const presetRange = (preset, today = new Date()) => {
  const y = today.getFullYear();
  const m = today.getMonth();
  const q = Math.floor(m / 3) * 3;
  const daysAgo = (n) => new Date(y, m, today.getDate() - n + 1);
  switch (preset) {
    case "thisMonth":
      return range(new Date(y, m, 1), endOfMonth(y, m));
    case "lastMonth":
      return range(new Date(y, m - 1, 1), endOfMonth(y, m - 1));
    case "thisQuarter":
      return range(new Date(y, q, 1), endOfMonth(y, q + 2));
    case "lastQuarter":
      return range(new Date(y, q - 3, 1), endOfMonth(y, q - 1));
    case "thisYear":
      return range(new Date(y, 0, 1), new Date(y, 11, 31));
    case "lastYear":
      return range(new Date(y - 1, 0, 1), new Date(y - 1, 11, 31));
    case "last30":
      return range(daysAgo(30), today);
    case "last90":
      return range(daysAgo(90), today);
    default:
      return null;
  }
};

/** Rango de un mes ("2024-03") o de un año ("2024"). */
export const keyRange = (key) => {
  const [y, m] = key.split("-").map(Number);
  return m ? range(new Date(y, m - 1, 1), endOfMonth(y, m - 1)) : range(new Date(y, 0, 1), new Date(y, 11, 31));
};

/** Meses y años presentes en una lista de fechas, del más reciente al más antiguo. */
export const periodsInData = (dates) => {
  const months = new Set();
  const years = new Set();
  for (const d of dates) {
    if (!d) continue;
    months.add(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    years.add(String(d.getFullYear()));
  }
  const desc = (a, b) => b.localeCompare(a);
  return { months: [...months].sort(desc), years: [...years].sort(desc) };
};
