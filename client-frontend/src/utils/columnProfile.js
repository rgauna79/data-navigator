// Perfil detallado de una columna numérica: percentiles y valores atípicos.

// Percentil p (0-100) de una lista ordenada, con interpolación lineal (como PERCENTIL.INC de Excel)
export const percentile = (sorted, p) => {
  if (sorted.length === 0) return undefined;
  const pos = ((sorted.length - 1) * p) / 100;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

/**
 * values: números de la columna.
 * Devuelve { p10, p25, p50, p75, p90, low, high } donde low/high son los
 * límites fuera de los cuales un valor es atípico. Se usa la regla de Tukey
 * para valores muy alejados (3 veces el rango intercuartílico por debajo de
 * P25 o por encima de P75): con 1,5 veces, columnas de importes con unos
 * pocos valores altos marcan como atípicos demasiados datos normales.
 */
export const numericProfile = (values) => {
  const sorted = Float64Array.from(values).sort();
  const [p10, p25, p50, p75, p90] = [10, 25, 50, 75, 90].map((p) => percentile(sorted, p));
  const iqr = p75 - p25;
  return { p10, p25, p50, p75, p90, low: p25 - 3 * iqr, high: p75 + 3 * iqr };
};

export const isOutlier = (n, { low, high }) => n < low || n > high;
