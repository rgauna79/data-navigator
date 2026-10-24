// Conclusiones automáticas sobre una hoja: lo más destacado de los datos
// (concentración, tendencia, mejor período) y problemas de calidad
// (duplicados, celdas vacías, valores atípicos, textos escritos distinto).
// Devuelve datos; el texto lo arma la interfaz en el idioma elegido.
import { dataRows, parseDate, toNumber } from "./excelUtils.js";
import { periodOf } from "./reportUtils.js";
import { blankRows, duplicateRows, textVariants } from "./cleanup.js";
import { isOutlier, numericProfile } from "./columnProfile.js";

const MAX_INSIGHTS = 6;

/**
 * fileData: filas de la hoja (la primera son los encabezados)
 * analysis: resultado de analyzeColumns (tipos, sumas, porcentaje con valor...)
 * Devuelve [{ kind, ...datos }] ordenado por importancia, con:
 * - trend:      { measure, dateCol, last, previous, change }   (mes vs mes anterior)
 * - peak:       { measure, dateCol, period, value }            (mejor mes)
 * - share:      { measure, column, col, value, share }         (categoría principal)
 * - duplicates: { count }
 * - variants:   { column, col, groups, example }      (textos escritos distinto)
 * - outliers:   { column, col, count }
 * - blanks:     { column, col, count, share }
 * measure: nombre de la columna numérica o null si se cuentan filas.
 * col / dateCol: índice de la columna, para mostrar las filas de cada conclusión.
 */
export const generateInsights = (fileData, analysis, max = MAX_INSIGHTS) => {
  if (!analysis?.length) return [];
  const rows = dataRows(fileData);
  if (rows.length < 2) return [];
  const insights = [];

  // Medida principal: la columna numérica con mayor suma (importe, ventas...)
  const numeric = analysis.filter((c) => c.type === "numeric" && c.count > 0);
  const measure = numeric.sort((a, b) => Math.abs(b.sum) - Math.abs(a.sum))[0] || null;
  const valueOf = (row) => (measure ? toNumber(row[measure.index], measure.decimal) : 1);

  // Tendencia y mejor mes según la primera columna de fecha
  const dateCol = analysis.find((c) => c.type === "date" && c.count > 0);
  if (dateCol) {
    const byMonth = new Map();
    for (const row of rows) {
      const d = parseDate(row[dateCol.index], dateCol.dateOrder);
      const v = valueOf(row);
      if (!d || isNaN(v)) continue;
      const { key } = periodOf(d, "month");
      byMonth.set(key, (byMonth.get(key) || 0) + v);
    }
    const months = [...byMonth].sort(([a], [b]) => a.localeCompare(b));
    if (months.length >= 2) {
      const [[last, lastValue], [previous, prevValue]] = [months.at(-1), months.at(-2)];
      if (prevValue !== 0) {
        insights.push({
          kind: "trend",
          measure: measure?.name ?? null,
          dateCol: dateCol.index,
          last,
          previous,
          change: ((lastValue - prevValue) / Math.abs(prevValue)) * 100,
        });
      }
      const [period, value] = months.reduce((best, m) => (m[1] > best[1] ? m : best));
      if (months.length >= 3) insights.push({ kind: "peak", measure: measure?.name ?? null, dateCol: dateCol.index, period, value });
    }
  }

  // Categoría que concentra la mayor parte de la medida
  const category = analysis.find((c) => c.type === "categorical" && c.unique >= 2 && c.unique <= 50);
  if (category) {
    const totals = new Map();
    let total = 0;
    for (const row of rows) {
      const key = row[category.index];
      const v = valueOf(row);
      if (key === "" || key == null || isNaN(v)) continue;
      totals.set(key, (totals.get(key) || 0) + v);
      total += v;
    }
    const [value, amount] = [...totals].reduce((best, e) => (e[1] > best[1] ? e : best), [null, -Infinity]);
    const share = total > 0 ? (amount / total) * 100 : 0;
    // Solo es destacable si supera claramente el reparto uniforme
    if (value !== null && share >= Math.max(25, 150 / totals.size)) {
      insights.push({
        kind: "share", measure: measure?.name ?? null, column: category.name, col: category.index, value, share,
      });
    }
  }

  // Calidad de los datos
  const duplicates = duplicateRows(fileData).length;
  if (duplicates > 0) insights.push({ kind: "duplicates", count: duplicates });

  for (const col of analysis.filter((c) => c.type === "categorical")) {
    const groups = textVariants(fileData, col.index).filter((g) => g.variants.length > 1);
    if (groups.length > 0) {
      const example = groups[0].variants.slice(0, 3).map(([v]) => `"${v}"`).join(", ");
      insights.push({ kind: "variants", column: col.name, col: col.index, groups: groups.length, example });
      break;
    }
  }

  let worstOutliers = null;
  for (const col of numeric) {
    const values = rows.map((r) => toNumber(r[col.index], col.decimal)).filter((n) => !isNaN(n));
    if (values.length < 8) continue;
    const profile = numericProfile(values);
    const count = values.filter((n) => isOutlier(n, profile)).length;
    // Si hay muchos, no son errores sueltos sino una columna muy dispersa: no se avisa
    if (count > 0 && count <= Math.max(1, values.length * 0.1) && (!worstOutliers || count > worstOutliers.count)) {
      worstOutliers = { kind: "outliers", column: col.name, col: col.index, count };
    }
  }
  if (worstOutliers) insights.push(worstOutliers);

  const blanks = analysis
    .map((c) => ({ c, missing: blankRows(fileData, c.index).length }))
    .filter(({ missing }) => missing > 0)
    .sort((a, b) => b.missing - a.missing)[0];
  if (blanks) {
    insights.push({
      kind: "blanks",
      column: blanks.c.name,
      col: blanks.c.index,
      count: blanks.missing,
      share: (blanks.missing / rows.length) * 100,
    });
  }

  return insights.slice(0, max);
};
