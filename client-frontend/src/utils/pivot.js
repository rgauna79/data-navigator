// Tabla dinámica de dos dimensiones: filas × columnas con una métrica por
// celda (cantidad, suma, promedio...), totales por fila, por columna y general.
import { aggregate, groupKeyOf, OTHER_LABEL } from "./reportUtils.js";

// Más columnas que esto no se leen en pantalla: el resto se junta en "Other"
export const MAX_PIVOT_COLUMNS = 24;

const sortKeys = (entries, type, totals) =>
  entries.sort((a, b) =>
    type === "date"
      ? a.start - b.start
      : (totals.get(b.key) ?? -Infinity) - (totals.get(a.key) ?? -Infinity) || a.label.localeCompare(b.label)
  );

/**
 * rows: filas de datos
 * rowSpec / colSpec: { groupIdx, groupType ("date" | "category"), dateOrder, period }
 * metric: count | sum | avg | min | max; valueIdx y decimal para la columna de valores
 * maxCols: categorías de columna a mostrar; las demás se juntan en "Other"
 * Devuelve { rowKeys, colKeys, value(rowKey, colKey), rowTotal(key), colTotal(key),
 *            grandTotal, skipped } (claves: [{ key, label, isOther? }])
 */
export const pivotRows = ({ rows, rowSpec, colSpec, metric = "count", valueIdx, decimal, maxCols = MAX_PIVOT_COLUMNS }) => {
  const rowInfo = new Map();
  const colInfo = new Map();
  const cells = new Map(); // "fila\u0000columna" -> { rows, values }
  let skipped = 0;
  const parsed = [];

  for (const row of rows) {
    const r = groupKeyOf(row, rowSpec);
    const c = groupKeyOf(row, colSpec);
    if (!r || !c) {
      skipped++;
      continue;
    }
    rowInfo.set(r.key, r);
    colInfo.set(c.key, c);
    parsed.push([r.key, c.key, row[valueIdx]]);
  }

  // Columnas de categoría: las de mayor total; el resto, en "Other"
  const colRowCounts = new Map();
  for (const [, c] of parsed) colRowCounts.set(c, (colRowCounts.get(c) || 0) + 1);
  let colEntries = sortKeys([...colInfo.values()], colSpec.groupType, colRowCounts);
  let otherCols = new Set();
  if (colSpec.groupType !== "date" && colEntries.length > maxCols) {
    otherCols = new Set(colEntries.slice(maxCols - 1).map((c) => c.key));
    colEntries = [...colEntries.slice(0, maxCols - 1), { key: OTHER_LABEL, label: OTHER_LABEL, isOther: true, otherKeys: [...otherCols] }];
  }
  const colOf = (key) => (otherCols.has(key) ? OTHER_LABEL : key);

  const add = (map, key, value) => {
    let bucket = map.get(key);
    if (!bucket) map.set(key, (bucket = { rows: 0, values: [] }));
    bucket.rows++;
    if (metric !== "count") bucket.values.push(value);
  };
  const rowBuckets = new Map();
  const colBuckets = new Map();
  const all = { rows: 0, values: [] };
  for (const [r, c, v] of parsed) {
    const col = colOf(c);
    add(cells, `${r}\u0000${col}`, v);
    add(rowBuckets, r, v);
    add(colBuckets, col, v);
    all.rows++;
    if (metric !== "count") all.values.push(v);
  }

  const result = (bucket) => (bucket ? aggregate(bucket.rows, bucket.values, metric, decimal) : null);
  const rowTotals = new Map([...rowBuckets].map(([k, b]) => [k, result(b)]));
  const rowEntries = sortKeys([...rowInfo.values()], rowSpec.groupType, rowTotals);

  return {
    rowKeys: rowEntries.map(({ key, label }) => ({ key, label })),
    colKeys: colEntries.map(({ key, label, isOther, otherKeys }) => ({ key, label, isOther, otherKeys })),
    value: (r, c) => result(cells.get(`${r}\u0000${c}`)),
    rowTotal: (r) => rowTotals.get(r) ?? null,
    colTotal: (c) => result(colBuckets.get(c)),
    grandTotal: result(all),
    skipped,
  };
};
