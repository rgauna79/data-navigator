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

// Normaliza separadores de miles/decimales a formato "1234.5".
// Acepta formato inglés ("1,234.50", el que genera SheetJS) y español
// ("1.234,50", habitual en CSV exportados con Excel en español):
// - Con "." y ",": el último que aparece es el separador decimal.
// - Solo ",": es de miles si separa grupos de 3 dígitos ("1,234"), si no es
//   decimal ("2000,25", "3,5").
// - Solo ".": es decimal, salvo varios grupos de 3 dígitos ("1.234.567").
const normalizeSeparators = (s) => {
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    return lastComma > lastDot
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");
  }
  if (lastComma !== -1) {
    return /^[-+]?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  // Varios puntos solo son miles si separan grupos de 3 ("15.01.2024" no es número)
  if (/^[-+]?\d{1,3}(\.\d{3}){2,}$/.test(s)) return s.replace(/\./g, "");
  return s;
};

// Convierte a número el texto que se ve en la hoja: quita símbolos de moneda,
// espacios y "%", y entiende separadores en formato inglés o español.
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
  s = normalizeSeparators(s.replace(/[$€£¥\s]/g, "").replace(/%$/, ""));
  if (s.startsWith("-") && negative) return NaN;
  if (!NUMBER_RE.test(s)) return NaN;
  const n = parseFloat(s);
  return negative ? -n : n;
};

const MONTH_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i;
const ISO_DATE_RE = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](.+))?$/;
const SHORT_DATE_RE = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:[ T,]+(.+))?$/;
const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?\s*(am|pm)?$/i;

// Años de 2 dígitos como Excel: 00-29 -> 2000s, 30-99 -> 1900s
const fullYear = (y) => (y.length === 2 ? (Number(y) < 30 ? 2000 : 1900) + Number(y) : Number(y));

// Construye una fecha local y comprueba que exista (rechaza 31/02, mes 13...)
const buildDate = (year, month, day, time) => {
  let h = 0, m = 0, sec = 0;
  if (time) {
    const t = time.trim().match(TIME_RE);
    if (!t) return null;
    h = Number(t[1]) % (t[4] ? 12 : 24) + (t[4]?.toLowerCase() === "pm" ? 12 : 0);
    m = Number(t[2]);
    sec = Number(t[3] || 0);
  }
  const d = new Date(year, month - 1, day, h, m, sec);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
};

// Deduce si las fechas cortas de una columna son día/mes/año ("dmy") o
// mes/día/año ("mdy"): "15/01/2024" solo puede ser dmy y "01/15/2024" solo mdy.
// Sin evidencia se usa mdy, el formato que genera SheetJS.
export const inferDateOrder = (values) => {
  let dmy = 0;
  let mdy = 0;
  for (const v of values) {
    if (typeof v !== "string") continue;
    const match = v.trim().match(SHORT_DATE_RE);
    if (!match) continue;
    const a = Number(match[1]);
    const b = Number(match[2]);
    if (a > 12 && b <= 12) dmy++;
    else if (b > 12 && a <= 12) mdy++;
  }
  return dmy > mdy ? "dmy" : "mdy";
};

// Interpreta un valor como fecha solo si "parece" una fecha.
// new Date("1") o new Date("12.5") son fechas válidas en JS, así que los
// números nunca se consideran fechas. Las fechas numéricas se construyen en
// hora local (new Date("2024-02-03") sería UTC y podría mostrar el día anterior).
// order: "mdy" o "dmy" para fechas cortas ambiguas (ver inferDateOrder).
export const parseDate = (value, order = "mdy") => {
  if (value instanceof Date) return isNaN(value) ? null : value;
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (s === "" || !isNaN(toNumber(s))) return null;

  const iso = s.match(ISO_DATE_RE);
  if (iso) return buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]), iso[4]);

  const short = s.match(SHORT_DATE_RE);
  if (short) {
    const [first, second] = [Number(short[1]), Number(short[2])];
    const year = fullYear(short[3]);
    const dayFirst = order === "dmy";
    return (
      buildDate(year, dayFirst ? second : first, dayFirst ? first : second, short[4]) ||
      // Si no encaja en el orden de la columna se prueba el otro ("15/01" en mdy)
      buildDate(year, dayFirst ? first : second, dayFirst ? second : first, short[4])
    );
  }

  if (!MONTH_RE.test(s)) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Devuelve un parser de fechas con el orden día/mes deducido de la columna
export const columnDateParser = (values) => {
  const order = inferDateOrder(values);
  return (v) => parseDate(v, order);
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
  const parse = columnDateParser(nonEmpty);
  const dates = nonEmpty.filter((v) => parse(v) !== null);
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

// Tipo de una columna a partir de sus valores:
// { type: "numeric" | "date" | "text", dateOrder?: "mdy" | "dmy" }
// Para detectar el tipo basta una muestra: con hojas de decenas de miles de
// filas revisar todos los valores congela la interfaz. La muestra se reparte
// por toda la columna (no solo el principio). Los valores que no encajan con
// el tipo se cuentan en el resumen y el usuario puede corregir el tipo.
const DETECTION_SAMPLE = 2000;

export const sampleValues = (values, max = DETECTION_SAMPLE) => {
  const nonEmpty = values.filter((v) => !isEmpty(v));
  if (nonEmpty.length <= max) return nonEmpty;
  const step = nonEmpty.length / max;
  return Array.from({ length: max }, (_, i) => nonEmpty[Math.floor(i * step)]);
};

export const detectColumnType = (values) => {
  const sample = sampleValues(values);
  if (isNumericColumn(sample)) return { type: "numeric" };
  if (isDateColumn(sample)) return { type: "date", dateOrder: inferDateOrder(sample) };
  return { type: "text" };
};

/**
 * Tipo final de cada columna: lo detectado, corregido por el usuario.
 * overrides: { [índice]: { type?, dateOrder? } }
 * Devuelve [{ type, dateOrder?, detected, overridden }] por columna.
 */
export const resolveColumnTypes = (fileData, overrides = {}) => {
  if (!fileData || fileData.length === 0) return [];
  const rows = dataRows(fileData);
  return getHeaders(fileData).map((_, i) => {
    const values = rows.map((row) => row[i]);
    const detected = detectColumnType(values);
    const override = overrides[i] || {};
    const type = override.type || detected.type;
    const resolved = { type, detected: detected.type, overridden: Boolean(override.type || override.dateOrder) };
    if (type === "date") {
      resolved.dateOrder = override.dateOrder || detected.dateOrder || inferDateOrder(sampleValues(values));
    }
    return resolved;
  });
};

const median = (nums) => {
  if (nums.length === 0) return undefined;
  const sorted = Float64Array.from(nums).sort();
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// Mediana y desviación estándar (poblacional) de una lista de números
export const spread = (nums) => {
  if (nums.length === 0) return { median: undefined, stdDev: undefined };
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / nums.length;
  return { median: median(nums), stdDev: Math.sqrt(variance) };
};

// Analiza todas las columnas del sheet y genera un resumen automático
// columnTypes: resultado de resolveColumnTypes (se calcula si no se pasa)
export const analyzeColumns = (fileData, columnTypes = resolveColumnTypes(fileData)) => {
  if (!fileData || fileData.length < 2) return [];

  const headers = getHeaders(fileData);
  const rows = dataRows(fileData);

  return headers.map((header, colIndex) => {
    const values = rows.map((row) => row[colIndex]);
    const nonEmpty = values.filter((v) => !isEmpty(v));
    const uniqueValues = new Set(nonEmpty);
    const { type, dateOrder, detected, overridden } = columnTypes[colIndex] || detectColumnType(values);
    const base = {
      index: colIndex,
      name: header,
      count: nonEmpty.length,
      // Porcentaje de filas con valor en esta columna
      fillRate: rows.length ? ((nonEmpty.length / rows.length) * 100).toFixed(1) : "0.0",
      unique: uniqueValues.size,
      detected: detected ?? type,
      overridden: Boolean(overridden),
    };

    if (type === "numeric") {
      const nums = numericValues(nonEmpty);
      const sum = nums.reduce((a, b) => a + b, 0);
      return {
        ...base,
        type: "numeric",
        ...minMax(nums),
        avg: nums.length ? sum / nums.length : undefined,
        sum,
        ...spread(nums),
        // Valores que no se pudieron leer como número
        invalid: nonEmpty.length - nums.length,
      };
    }

    if (type === "date") {
      const times = nonEmpty
        .map((v) => parseDate(v, dateOrder))
        .filter(Boolean)
        .map((d) => d.getTime());
      const { min, max } = minMax(times);
      return {
        ...base,
        type: "date",
        dateOrder,
        min: times.length ? new Date(min) : undefined,
        max: times.length ? new Date(max) : undefined,
        invalid: nonEmpty.length - times.length,
      };
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
