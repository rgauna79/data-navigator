// Funciones puras para analizar los datos de una hoja.
// Las que dependen de la librería xlsx están en sheetParser.js para que esa
// librería solo se cargue en las páginas que leen archivos.

// Solo recorta espacios. No se cambia mayúsculas/minúsculas para no alterar
// los datos originales (emails, nombres, códigos...).
export const formatJson = (json) =>
  json.map((row) =>
    row.map((cell) => (typeof cell === "string" ? cell.trim() : cell))
  );

// Completa filas cortas para que todas tengan el mismo número de columnas
export const normalizeRows = (rows) => {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);
  return rows.map((row) =>
    row.length === width ? row : [...row, ...Array(width - row.length).fill("")]
  );
};

// Encabezados de la hoja; celdas vacías se nombran "Column N"
export const getHeaders = (fileData) =>
  (fileData?.[0] || []).map((h, i) =>
    h === "" || h == null ? `Column ${i + 1}` : String(h)
  );

export const hasUsableData = (formatted) =>
  formatted
    .slice(1)
    .some((row) => Object.values(row).some((cell) => cell !== ""));

const isEmpty = (v) => v === null || v === undefined || v === "";

const NUMBER_RE = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

// Convierte el texto formateado por Excel a número.
// SheetJS formatea siempre con "," de miles y "." decimal, así que se pueden
// quitar símbolos de moneda, separadores de miles y "%".
// Los negativos contables "(1,200)" se convierten a -1200.
// Devuelve NaN si el valor no es numérico.
export const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  let s = value.trim();
  if (s === "") return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[$€£¥\s]/g, "").replace(/,/g, "").replace(/%$/, "");
  if (s.startsWith("-") && negative) return NaN;
  if (!NUMBER_RE.test(s)) return NaN;
  const n = parseFloat(s);
  return negative ? -n : n;
};

const MONTH_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i;
const DATE_SEP_RE = /^\d{1,4}[-/.]\d{1,2}([-/.]\d{1,4})?([ T].*)?$/;

// Interpreta un valor como fecha solo si "parece" una fecha.
// new Date("1") o new Date("12.5") son fechas válidas en JS, así que los
// números nunca se consideran fechas.
export const parseDate = (value) => {
  if (value instanceof Date) return isNaN(value) ? null : value;
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (s === "" || !isNaN(toNumber(s))) return null;
  if (!DATE_SEP_RE.test(s) && !MONTH_RE.test(s)) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Detecta si una columna es numérica (>60% de valores no vacíos son números)
export const isNumericColumn = (values) => {
  const nonEmpty = values.filter((v) => !isEmpty(v));
  if (nonEmpty.length === 0) return false;
  const numeric = nonEmpty.filter((v) => !isNaN(toNumber(v)));
  return numeric.length / nonEmpty.length > 0.6;
};

// Detecta si una columna es de fecha (>60% de valores no vacíos son fechas)
export const isDateColumn = (values) => {
  const nonEmpty = values.filter((v) => !isEmpty(v));
  if (nonEmpty.length === 0) return false;
  const dates = nonEmpty.filter((v) => parseDate(v) !== null);
  return dates.length / nonEmpty.length > 0.6;
};

// Mínimo y máximo sin usar Math.min(...arr), que desborda la pila con
// arrays muy grandes
export const minMax = (values) => {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return values.length ? { min, max } : { min: undefined, max: undefined };
};

export const numericValues = (values) =>
  values.map(toNumber).filter((n) => !isNaN(n));

// Filas de datos (sin encabezado ni filas vacías)
export const dataRows = (fileData) =>
  (fileData || [])
    .slice(1)
    .filter((row) => Object.values(row).some((cell) => !isEmpty(cell)));

// Analiza todas las columnas del sheet y genera un resumen automático
export const analyzeColumns = (fileData) => {
  if (!fileData || fileData.length < 2) return [];

  const headers = getHeaders(fileData);
  const rows = dataRows(fileData);

  return headers.map((header, colIndex) => {
    const values = rows.map((row) => row[colIndex]);
    const nonEmpty = values.filter((v) => !isEmpty(v));
    const uniqueValues = new Set(nonEmpty);
    const base = {
      index: colIndex,
      name: header,
      count: nonEmpty.length,
      unique: uniqueValues.size,
    };

    if (isNumericColumn(values)) {
      const nums = numericValues(nonEmpty);
      const sum = nums.reduce((a, b) => a + b, 0);
      return {
        ...base,
        type: "numeric",
        ...minMax(nums),
        avg: sum / nums.length,
        sum,
      };
    }

    if (isDateColumn(values)) {
      const times = nonEmpty
        .map(parseDate)
        .filter(Boolean)
        .map((d) => d.getTime());
      const { min, max } = minMax(times);
      return { ...base, type: "date", min: new Date(min), max: new Date(max) };
    }

    // Categórica: top 5 valores más frecuentes
    const freq = {};
    nonEmpty.forEach((v) => {
      freq[v] = (freq[v] || 0) + 1;
    });
    const topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { ...base, type: "categorical", topValues };
  });
};
