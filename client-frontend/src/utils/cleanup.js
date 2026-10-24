// Limpieza de datos. Cada función recibe las filas de la hoja (la primera
// son los encabezados) y devuelve los cambios a aplicar, sin modificarlas:
// - celdas: [{ row, col, value }]  (row = índice en la hoja)
// - filas a eliminar: [row]
// Así se pueden mostrar antes de aplicar y deshacer de una vez.

const isBlank = (v) => v === null || v === undefined || String(v).trim() === "";
const dataIndexes = (rows) =>
  rows.map((_, i) => i).filter((i) => i > 0 && rows[i].length && rows[i].some((v) => !isBlank(v)));

/** Filas repetidas (todas las celdas iguales); se conserva la primera. */
export const duplicateRows = (rows) => {
  const seen = new Set();
  const dupes = [];
  for (const i of dataIndexes(rows)) {
    const key = JSON.stringify(rows[i].map((v) => (v == null ? "" : String(v).trim())));
    if (seen.has(key)) dupes.push(i);
    else seen.add(key);
  }
  return dupes;
};

// Clave para comparar textos sin mayúsculas, acentos ni espacios repetidos
export const textKey = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/**
 * Grupos de valores que solo se diferencian en mayúsculas, acentos o
 * espacios ("Norte", "NORTE ", "norte"). Devuelve [{ variants: [[valor, veces]], target }]
 * donde target es la variante más frecuente (sin espacios sobrantes).
 */
export const textVariants = (rows, col) => {
  const groups = new Map();
  for (const i of dataIndexes(rows)) {
    const v = rows[i][col];
    if (isBlank(v)) continue;
    const key = textKey(v);
    if (!groups.has(key)) groups.set(key, new Map());
    const counts = groups.get(key);
    counts.set(String(v), (counts.get(String(v)) || 0) + 1);
  }
  const result = [];
  for (const counts of groups.values()) {
    const variants = [...counts].sort((a, b) => b[1] - a[1]);
    const target = variants[0][0].replace(/\s+/g, " ").trim();
    if (variants.length > 1 || variants[0][0] !== target) result.push({ variants, target });
  }
  return result;
};

/** Cambios para unificar las variantes de una columna (ver textVariants). */
export const unifyTextChanges = (rows, col) => {
  const targets = new Map();
  for (const { variants, target } of textVariants(rows, col)) {
    for (const [v] of variants) if (v !== target) targets.set(v, target);
  }
  return dataIndexes(rows)
    .filter((i) => targets.has(String(rows[i][col] ?? "")))
    .map((i) => ({ row: i, col, value: targets.get(String(rows[i][col])) }));
};

/**
 * Buscar y reemplazar en una columna.
 * whole: true reemplaza solo celdas iguales al texto; false, el texto dentro de la celda.
 * Sin distinguir mayúsculas.
 */
export const replaceChanges = (rows, col, find, replacement, { whole = false } = {}) => {
  if (find === "") return [];
  const needle = find.toLowerCase();
  const pattern = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const changes = [];
  for (const i of dataIndexes(rows)) {
    const v = String(rows[i][col] ?? "");
    let next = v;
    if (whole) {
      if (v.trim().toLowerCase() === needle) next = replacement;
    } else if (v.toLowerCase().includes(needle)) {
      next = v.replace(pattern, replacement);
    }
    if (next !== v) changes.push({ row: i, col, value: next });
  }
  return changes;
};

/** Celdas vacías de una columna: índices de fila. */
export const blankRows = (rows, col) => dataIndexes(rows).filter((i) => isBlank(rows[i][col]));

/** Cambios para rellenar las celdas vacías de una columna. */
export const fillBlankChanges = (rows, col, value) => blankRows(rows, col).map((row) => ({ row, col, value }));
