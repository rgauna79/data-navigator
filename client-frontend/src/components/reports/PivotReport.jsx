import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileCsv, faPalette } from "@fortawesome/free-solid-svg-icons";
import { BLANK_LABEL, METRICS, PERIODS, downloadCsv, formatPeriodLabel } from "../../utils/reportUtils.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

// Color de fondo de una celda según su valor (de azul claro a azul intenso)
const heatStyle = (value, min, max) => {
  if (value == null || max === min) return undefined;
  const ratio = (value - min) / (max - min);
  return { backgroundColor: `rgba(59,130,246,${(0.08 + ratio * 0.62).toFixed(2)})` };
};

// Tabla dinámica: filas × columnas con totales.
// pivot: resultado de pivotRows; config: { rowIdx, rowType, rowPeriod, colIdx, colType, colPeriod, metric, valueIdx }
// onDrill({ rowKey, colKeys, label }): muestra las filas de una celda, fila o columna
function PivotReport({ pivot, config, headers, includedOptions, onDrill }) {
  const { t, tn, locale, fmtNumber, fmtDecimal } = useI18n();
  const [heatmap, setHeatmap] = useState(true);
  const { metric, rowIdx, rowType, rowPeriod, colIdx, colType, colPeriod, valueIdx } = config;

  const name = (idx) => headers?.[idx] ?? t("Column {n}", { n: idx + 1 });
  const metricLabel =
    metric === "count" ? t("Count of rows") : t("{metric} of {column}", { metric: t(METRICS[metric]), column: name(valueIdx) });
  const axisLabel = (idx, type, period) => (type === "date" ? `${name(idx)} (${t(PERIODS[period]).toLowerCase()})` : name(idx));
  const title = t("{metric} by {rows} and {columns}", {
    metric: metricLabel,
    rows: axisLabel(rowIdx, rowType, rowPeriod),
    columns: axisLabel(colIdx, colType, colPeriod),
  });

  const fmt = (v) => (v == null ? "" : metric === "count" ? fmtNumber(v) : fmtDecimal(v));
  const labelOf = (k, type, period) => {
    if (k.isOther) return tn("Other ({count} group)", "Other ({count} groups)", k.otherKeys.length);
    if (type === "date") return formatPeriodLabel(k.key, period, locale, t);
    return k.key === BLANK_LABEL ? t("(blank)") : k.label;
  };
  const rowLabel = (k) => labelOf(k, rowType, rowPeriod);
  const colLabel = (k) => labelOf(k, colType, colPeriod);
  const colKeysOf = (k) => (k.isOther ? k.otherKeys : [k.key]);

  // Rango de valores de las celdas para el mapa de calor
  let min = Infinity;
  let max = -Infinity;
  for (const r of pivot.rowKeys) {
    for (const c of pivot.colKeys) {
      const v = pivot.value(r.key, c.key);
      if (v == null) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }

  const handleDownload = () => {
    const rows = [
      [`${name(rowIdx)} \\ ${name(colIdx)}`, ...pivot.colKeys.map(colLabel), t("Total")],
      ...pivot.rowKeys.map((r) => [
        rowLabel(r),
        ...pivot.colKeys.map((c) => pivot.value(r.key, c.key) ?? ""),
        pivot.rowTotal(r.key) ?? "",
      ]),
      [t("Total"), ...pivot.colKeys.map((c) => pivot.colTotal(c.key) ?? ""), pivot.grandTotal ?? ""],
    ];
    const safeName = title.normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").toLowerCase();
    downloadCsv(`${safeName || "pivot"}.csv`, rows);
  };

  const drillCell = (r, c) =>
    onDrill?.({ rowKey: r?.key, colKeys: c ? colKeysOf(c) : null, label: [r && rowLabel(r), c && colLabel(c)].filter(Boolean).join(" · ") });

  const cellButton = "w-full h-full px-3 py-2 text-right tabular-nums hover:ring-2 hover:ring-inset hover:ring-blue-500 rounded-sm";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {includedOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {includedOptions.map((option) => (
              <span
                key={option}
                className="inline-flex items-center text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2.5 py-1"
              >
                {option}
              </span>
            ))}
          </div>
        )}
      </div>

      {pivot.skipped > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          {tn("{count} row without a valid date was left out.", "{count} rows without a valid date were left out.", pivot.skipped)}
        </p>
      )}

      {pivot.rowKeys.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("No rows match the selected filters.")}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2" data-html2canvas-ignore>
            <button
              onClick={() => setHeatmap((v) => !v)}
              aria-pressed={heatmap}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                heatmap
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400"
              }`}
            >
              <FontAwesomeIcon icon={faPalette} className="text-xs" /> {t("Heatmap")}
            </button>
            <span className="text-xs text-gray-400">{t("Click a value to see its rows.")}</span>
          </div>

          <div className="overflow-auto max-h-[70vh] rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="text-sm border-collapse min-w-full">
              <thead className="text-xs text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="sticky top-0 left-0 z-20 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-left font-semibold whitespace-nowrap border-b border-r border-gray-200 dark:border-gray-600">
                    {name(rowIdx)} \ {name(colIdx)}
                  </th>
                  {pivot.colKeys.map((c) => (
                    <th
                      key={c.key}
                      className={`sticky top-0 z-10 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-right font-semibold whitespace-nowrap border-b border-gray-200 dark:border-gray-600 ${c.isOther ? "italic" : ""}`}
                    >
                      {colLabel(c)}
                    </th>
                  ))}
                  <th className="sticky top-0 z-10 bg-gray-200 dark:bg-gray-600 px-3 py-2 text-right font-bold whitespace-nowrap border-b border-gray-200 dark:border-gray-600">
                    {t("Total")}
                  </th>
                </tr>
              </thead>
              <tbody className="text-gray-700 dark:text-gray-200">
                {pivot.rowKeys.map((r) => (
                  <tr key={r.key} className="border-b border-gray-100 dark:border-gray-700">
                    <th className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-3 py-2 text-left font-medium whitespace-nowrap border-r border-gray-200 dark:border-gray-600">
                      {rowLabel(r)}
                    </th>
                    {pivot.colKeys.map((c) => {
                      const v = pivot.value(r.key, c.key);
                      return (
                        <td key={c.key} className="p-0" style={heatmap ? heatStyle(v, min, max) : undefined}>
                          {v == null ? (
                            <span className="block px-3 py-2 text-right text-gray-300 dark:text-gray-600">—</span>
                          ) : (
                            <button className={cellButton} onClick={() => drillCell(r, c)}>
                              {fmt(v)}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-0 bg-gray-50 dark:bg-gray-700/50 font-semibold">
                      <button className={cellButton} onClick={() => drillCell(r, null)}>
                        {fmt(pivot.rowTotal(r.key))}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-semibold text-gray-900 dark:text-white">
                <tr className="bg-gray-50 dark:bg-gray-700/50">
                  <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-left border-r border-gray-200 dark:border-gray-600">
                    {t("Total")}
                  </th>
                  {pivot.colKeys.map((c) => (
                    <td key={c.key} className="p-0">
                      <button className={cellButton} onClick={() => drillCell(null, c)}>
                        {fmt(pivot.colTotal(c.key))}
                      </button>
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right tabular-nums bg-gray-200 dark:bg-gray-600">{fmt(pivot.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end" data-html2canvas-ignore>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={faFileCsv} /> {t("Download CSV")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default PivotReport;
