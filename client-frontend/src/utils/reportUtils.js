// Lógica de los informes: filtros, agrupación y exportación.
// Funciones puras para poder probarlas sin React.
import { parseDate, toNumber } from "./excelUtils.js";
import { tk } from "../i18n/tk.js";

// Fin del día, para que el rango de fechas incluya el día "hasta"
const endOfDay = (d) => {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
};

// Compara una fila con el filtro de una columna: valor exacto, rango de
// fechas { from, to } o rango numérico { min, max } (cualquiera opcional).
// column: { dateOrder, decimal } de esa columna (ver analyzeColumns).
export const matchRow = (row, idx, value, column = {}) => {
  if (value === "" || value == null) return true;
  if (typeof value === "object" && "from" in value) {
    const d = parseDate(row[idx], column.dateOrder);
    if (!d) return false;
    return d >= new Date(value.from) && d <= endOfDay(value.to);
  }
  if (typeof value === "object" && ("min" in value || "max" in value)) {
    const n = toNumber(row[idx], column.decimal);
    if (isNaN(n)) return false;
    const min = toNumber(String(value.min ?? ""), column.decimal);
    const max = toNumber(String(value.max ?? ""), column.decimal);
    return (isNaN(min) || n >= min) && (isNaN(max) || n <= max);
  }
  return String(row[idx]) === String(value);
};

// filters: { [índice de columna]: valor | { from, to } | { min, max } }
// analysis: resultado de analyzeColumns (orden de fechas y separador decimal)
export const applyFilters = (rows, filters = {}, analysis = []) => {
  const entries = Object.entries(filters);
  if (entries.length === 0) return rows;
  return rows.filter((row) =>
    entries.every(([idx, value]) => matchRow(row, Number(idx), value, analysis[idx]))
  );
};

// Texto legible de un filtro de informe (ver matchRow); locale para las fechas
export const describeFilter = (value, locale = "en-US") => {
  if (value && typeof value === "object" && "from" in value) {
    const fmt = (d) => new Date(d).toLocaleDateString(locale);
    return `${fmt(value.from)} → ${fmt(value.to)}`;
  }
  if (value && typeof value === "object") {
    const { min = "", max = "" } = value;
    if (min !== "" && max !== "") return `${min} – ${max}`;
    return min !== "" ? `≥ ${min}` : `≤ ${max}`;
  }
  return String(value);
};

export const METRICS = {
  count: tk("Count of rows"),
  sum: tk("Sum"),
  avg: tk("Average"),
  min: tk("Minimum"),
  max: tk("Maximum"),
};

export const PERIODS = {
  day: tk("Day"),
  week: tk("Week"),
  month: tk("Month"),
  quarter: tk("Quarter"),
  year: tk("Year"),
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
export const periodStart = (d, period) => {
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

export const nextPeriod = (d, period) => {
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

/**
 * Etiqueta de un período en el idioma de la interfaz a partir de su clave
 * (ver periodOf): "2024-03" -> "mar 2024" en español.
 * t: función de traducción (para "Week {week}, {year}" y "Q{q} {year}").
 */
export const formatPeriodLabel = (key, period, locale = "en-US", t = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k])) => {
  const [y, rest] = [Number(key.slice(0, 4)), key.slice(5)];
  switch (period) {
    case "day":
      return new Date(y, Number(rest.slice(0, 2)) - 1, Number(rest.slice(3, 5))).toLocaleDateString(locale, {
        month: "short", day: "numeric", year: "numeric",
      });
    case "week":
      return t("Week {week}, {year}", { week: Number(rest.slice(1)), year: y });
    case "quarter":
      return t("Q{q} {year}", { q: rest.slice(1), year: y });
    case "year":
      return String(y);
    default: {
      const month = new Date(y, Number(rest) - 1, 1).toLocaleDateString(locale, { month: "short" }).replace(".", "");
      return `${month} ${y}`;
    }
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
// decimal: separador decimal de la columna de valores.
export const aggregate = (rowCount, values, metric, decimal) => {
  if (metric === "count") return rowCount;
  const nums = values.map((v) => toNumber(v, decimal)).filter((n) => !isNaN(n));
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

/**
 * Histograma: reparte los números en intervalos del mismo ancho.
 * La cantidad de intervalos sigue la regla de Sturges (entre 1 y maxBins).
 * Devuelve [{ from, to, count }]; el último intervalo incluye el máximo.
 */
export const histogram = (values, maxBins = 12) => {
  if (values.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) return [{ from: min, to: max, count: values.length }];
  const bins = Math.min(maxBins, Math.max(1, Math.ceil(Math.log2(values.length) + 1)));
  const width = (max - min) / bins;
  const result = Array.from({ length: bins }, (_, i) => ({
    from: min + i * width,
    to: i === bins - 1 ? max : min + (i + 1) * width,
    count: 0,
  }));
  for (const v of values) {
    result[Math.min(bins - 1, Math.floor((v - min) / width))].count++;
  }
  return result;
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
 * @param decimal     separador decimal de esa columna ("." o ",")
 * @param topN        máximo de grupos de categorías; el resto se junta en "Other"
 * @returns { groups: [{ key, label, value, rows }], total, skipped }
 *   total: métrica aplicada a todas las filas agrupadas
 *   skipped: filas sin fecha válida (solo agrupación por fecha)
 */
/**
 * Grupo al que pertenece una fila: { key, label, start? } o null si la fecha
 * no es válida. spec: { groupIdx, groupType ("date" | otro), dateOrder, period }
 */
export const groupKeyOf = (row, { groupIdx, groupType, dateOrder = "mdy", period = "month" }) => {
  if (groupType === "date") {
    const d = parseDate(row[groupIdx], dateOrder);
    if (!d) return null;
    return { ...periodOf(d, period), start: periodStart(d, period) };
  }
  const raw = row[groupIdx];
  const key = raw === "" || raw == null ? BLANK_LABEL : String(raw);
  return { key, label: key };
};

/**
 * Filas de un grupo del informe (para ver el detalle de un resultado).
 * keys: clave o claves de grupo (el grupo "Other" reúne varias, ver otherKeys).
 */
export const rowsInGroup = (rows, spec, keys) => {
  const wanted = new Set(Array.isArray(keys) ? keys : [keys]);
  return rows.filter((row) => wanted.has(groupKeyOf(row, spec)?.key));
};

export const groupRows = ({
  rows,
  groupIdx,
  groupType,
  dateOrder = "mdy",
  period = "month",
  metric = "count",
  valueIdx,
  decimal,
  topN = 10,
}) => {
  const buckets = new Map();
  let skipped = 0;

  const spec = { groupIdx, groupType, dateOrder, period };
  for (const row of rows) {
    const group = groupKeyOf(row, spec);
    if (!group) {
      skipped++;
      continue;
    }
    const { key, label, start } = group;
    if (!buckets.has(key)) buckets.set(key, { key, label, start, rows: 0, values: [] });
    const bucket = buckets.get(key);
    bucket.rows++;
    if (metric !== "count") bucket.values.push(row[valueIdx]);
  }

  const all = [...buckets.values()];
  for (const b of all) b.value = aggregate(b.rows, b.values, metric, decimal);
  const toGroup = ({ key, label, rows: count, value }) => ({ key, label, rows: count, value });

  const total = aggregate(
    all.reduce((n, b) => n + b.rows, 0),
    all.flatMap((b) => b.values),
    metric,
    decimal
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
        metric,
        decimal
      ),
      isOther: true,
      // Número de grupos agrupados en "Other" y sus claves
      groupCount: rest.length,
      otherKeys: rest.map((b) => b.key),
    });
  }
  return { groups, total, skipped };
};

// Prepara filas para exportar: encabezados + datos. Con numericCols, las
// columnas numéricas se convierten a número (para que Excel pueda sumarlas);
// los valores que no se pueden convertir se dejan como texto.
// decimalOf(i): separador decimal de la columna i.
export const exportRows = (headers, rows, numericCols = new Set(), decimalOf = () => undefined) => [
  headers,
  ...rows.map((row) =>
    headers.map((_, i) => {
      const cell = row[i] ?? "";
      if (!numericCols.has(i)) return cell;
      const n = toNumber(cell, decimalOf(i));
      return isNaN(n) ? cell : n;
    })
  ),
];

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
