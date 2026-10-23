// Lógica de los informes: filtros, agrupación y exportación.
// Funciones puras para poder probarlas sin React.
import { parseDate, toNumber } from "./excelUtils.js";

// Fin del día, para que el rango de fechas incluya el día "hasta"
const endOfDay = (d) => {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
};

// Compara una fila con el filtro de una columna (valor exacto o rango de fechas).
// dateOrder: "mdy" o "dmy" según el formato de fechas de esa columna.
export const matchRow = (row, idx, value, dateOrder) => {
  if (value === "" || value == null) return true;
  if (typeof value === "object" && "from" in value) {
    const d = parseDate(row[idx], dateOrder);
    if (!d) return false;
    return d >= new Date(value.from) && d <= endOfDay(value.to);
  }
  return String(row[idx]) === String(value);
};

// filters: { [índice de columna]: valor | { from, to } }
// analysis: resultado de analyzeColumns, para conocer el orden de fechas
export const applyFilters = (rows, filters = {}, analysis = []) => {
  const entries = Object.entries(filters);
  if (entries.length === 0) return rows;
  return rows.filter((row) =>
    entries.every(([idx, value]) => matchRow(row, Number(idx), value, analysis[idx]?.dateOrder))
  );
};

export const METRICS = {
  count: "Count of rows",
  sum: "Sum",
  avg: "Average",
  min: "Minimum",
  max: "Maximum",
};

export const PERIODS = {
  day: "Day",
  week: "Week",
  month: "Month",
  quarter: "Quarter",
  year: "Year",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

// Semana ISO 8601: empieza el lunes; la semana 1 contiene el primer jueves del año
const isoWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { year: d.getUTCFullYear(), week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7) };
};

// Inicio del período que contiene la fecha
const periodStart = (d, period) => {
  switch (period) {
    case "day":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case "week": {
      const day = (d.getDay() + 6) % 7; // lunes = 0
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
    }
    case "quarter":
      return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
    case "year":
      return new Date(d.getFullYear(), 0, 1);
    default:
      return new Date(d.getFullYear(), d.getMonth(), 1);
  }
};

const nextPeriod = (d, period) => {
  switch (period) {
    case "day":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    case "week":
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    case "quarter":
      return new Date(d.getFullYear(), d.getMonth() + 3, 1);
    case "year":
      return new Date(d.getFullYear() + 1, 0, 1);
    default:
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
};

// Clave ordenable y etiqueta legible de un período
export const periodOf = (date, period = "month") => {
  const start = periodStart(date, period);
  const y = start.getFullYear();
  const m = start.getMonth();
  switch (period) {
    case "day":
      return { key: `${y}-${pad(m + 1)}-${pad(start.getDate())}`, label: `${MONTHS[m]} ${start.getDate()}, ${y}` };
    case "week": {
      const { year, week } = isoWeek(start);
      return { key: `${year}-W${pad(week)}`, label: `Week ${week}, ${year}` };
    }
    case "quarter": {
      const q = Math.floor(m / 3) + 1;
      return { key: `${y}-Q${q}`, label: `Q${q} ${y}` };
    }
    case "year":
      return { key: String(y), label: String(y) };
    default:
      return { key: `${y}-${pad(m + 1)}`, label: `${MONTHS[m]} ${y}` };
  }
};

// Aplica la métrica a los valores de un grupo. count cuenta filas; el resto
// usa solo los valores numéricos y devuelve null si no hay ninguno.
export const aggregate = (rowCount, values, metric) => {
  if (metric === "count") return rowCount;
  const nums = values.map(toNumber).filter((n) => !isNaN(n));
  if (nums.length === 0) return null;
  switch (metric) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "avg":
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    case "min":
      return nums.reduce((a, b) => (b < a ? b : a));
    case "max":
      return nums.reduce((a, b) => (b > a ? b : a));
    default:
      throw new Error(`Unknown metric: ${metric}`);
  }
};

// Máximo de períodos a rellenar con huecos; evita, por ejemplo, miles de días vacíos
const MAX_FILLED_PERIODS = 500;

export const BLANK_LABEL = "(blank)";
export const OTHER_LABEL = "Other";

/**
 * Agrupa filas y calcula una métrica por grupo (como una tabla dinámica simple).
 *
 * @param rows        filas de datos (sin encabezado)
 * @param groupIdx    índice de la columna por la que agrupar
 * @param groupType   "date" agrupa por período; cualquier otro valor, por valor exacto
 * @param dateOrder   "mdy" | "dmy" para fechas cortas de la columna
 * @param period      day | week | month | quarter | year (solo fechas)
 * @param metric      count | sum | avg | min | max
 * @param valueIdx    columna numérica para la métrica (no se usa con count)
 * @param topN        máximo de grupos de categorías; el resto se junta en "Other"
 * @returns { groups: [{ key, label, value, rows }], total, skipped }
 *   total: métrica aplicada a todas las filas agrupadas
 *   skipped: filas sin fecha válida (solo agrupación por fecha)
 */
export const groupRows = ({
  rows,
  groupIdx,
  groupType,
  dateOrder = "mdy",
  period = "month",
  metric = "count",
  valueIdx,
  topN = 10,
}) => {
  const buckets = new Map();
  let skipped = 0;

  for (const row of rows) {
    let key;
    let label;
    let start;
    if (groupType === "date") {
      const d = parseDate(row[groupIdx], dateOrder);
      if (!d) {
        skipped++;
        continue;
      }
      ({ key, label } = periodOf(d, period));
      start = periodStart(d, period);
    } else {
      const raw = row[groupIdx];
      key = raw === "" || raw == null ? BLANK_LABEL : String(raw);
      label = key;
    }
    if (!buckets.has(key)) buckets.set(key, { key, label, start, rows: 0, values: [] });
    const bucket = buckets.get(key);
    bucket.rows++;
    if (metric !== "count") bucket.values.push(row[valueIdx]);
  }

  const all = [...buckets.values()];
  for (const b of all) b.value = aggregate(b.rows, b.values, metric);
  const toGroup = ({ key, label, rows: count, value }) => ({ key, label, rows: count, value });

  const total = aggregate(
    all.reduce((n, b) => n + b.rows, 0),
    all.flatMap((b) => b.values),
    metric
  );

  if (groupType === "date") {
    all.sort((a, b) => a.start - b.start);
    let groups = all.map(toGroup);
    // Rellena los períodos sin datos para que la línea temporal no salte meses.
    // count y sum valen 0 en un período vacío; avg/min/max no tienen valor.
    if (all.length > 1) {
      const filled = [];
      const byKey = new Map(groups.map((g) => [g.key, g]));
      const last = all[all.length - 1].start;
      for (let d = all[0].start; d <= last && filled.length <= MAX_FILLED_PERIODS; d = nextPeriod(d, period)) {
        const { key, label } = periodOf(d, period);
        filled.push(
          byKey.get(key) || { key, label, rows: 0, value: metric === "count" || metric === "sum" ? 0 : null }
        );
      }
      if (filled.length <= MAX_FILLED_PERIODS) groups = filled;
    }
    return { groups, total, skipped };
  }

  // Categorías: de mayor a menor valor; los grupos sin valor van al final
  all.sort((a, b) => {
    if (a.value === null) return b.value === null ? 0 : 1;
    if (b.value === null) return -1;
    return b.value - a.value || a.label.localeCompare(b.label);
  });
  const limit = topN && topN > 0 ? topN : all.length;
  const groups = all.slice(0, limit).map(toGroup);
  const rest = all.slice(limit);
  if (rest.length > 0) {
    // "Other" se calcula sobre las filas restantes, no sumando resultados,
    // para que el promedio, mínimo y máximo sean correctos
    groups.push({
      key: OTHER_LABEL,
      label: `${OTHER_LABEL} (${rest.length} ${rest.length === 1 ? "group" : "groups"})`,
      rows: rest.reduce((n, b) => n + b.rows, 0),
      value: aggregate(
        rest.reduce((n, b) => n + b.rows, 0),
        rest.flatMap((b) => b.values),
        metric
      ),
      isOther: true,
    });
  }
  return { groups, total, skipped };
};

// Convierte una matriz a CSV (RFC 4180): comillas para valores con , " o saltos de línea
export const toCsv = (rows) =>
  rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    )
    .join("\r\n");

// Descarga un texto como archivo. El BOM hace que Excel abra el CSV como UTF-8.
export const downloadCsv = (fileName, rows) => {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
