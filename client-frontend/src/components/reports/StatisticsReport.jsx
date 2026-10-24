import { isNumericColumn, minMax, numericValues, spread } from "../../utils/excelUtils.js";

const fmt = (n) =>
  n === undefined || n === null || isNaN(n)
    ? "—"
    : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// numericColumns: índices de las columnas numéricas (según el tipo de cada
// columna, incluidas las correcciones del usuario); si no se pasa, se detecta
function StatisticsReport({ filteredData, totalRows, includedOptions, headers, numericColumns }) {
  const nCols = headers?.length || filteredData[0]?.length || 0;
  const numericCols =
    numericColumns ??
    [...Array(nCols).keys()].filter((idx) => isNumericColumn(filteredData.map((row) => row[idx])));

  const columnName = (idx) => headers?.[idx] || `Column ${idx + 1}`;

  const stats = (columnIndex) => {
    const values = numericValues(filteredData.map((row) => row[columnIndex]));
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    const { min, max } = minMax(values);
    const { median, stdDev } = spread(values);
    return { sum, avg: sum / values.length, median, min, max, range: max - min, stdDev, count: values.length };
  };

  return (
    <div className="space-y-5">
      {/* Filters applied */}
      {includedOptions.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Filters applied
          </p>
          <div className="flex flex-wrap gap-1.5">
            {includedOptions.map((option) => (
              <span
                key={option}
                className="inline-flex items-center text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2.5 py-1"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Total rows */}
      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-4 flex items-center justify-between border border-gray-100 dark:border-gray-700 shadow-xs">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total matching rows</span>
        <span className="text-2xl font-black text-gray-900 dark:text-white">{totalRows.toLocaleString("en-US")}</span>
      </div>

      {/* Numeric stats per column */}
      {numericCols.length === 0 ? (
        <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-500 dark:text-gray-400">
          No numeric columns to summarize.
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Numeric columns
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numericCols.map((idx) => {
              const s = stats(idx);
              return (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-xs">
                  <p className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 truncate">
                    {columnName(idx)}
                  </p>
                  {!s ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No numeric values.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="space-y-3 pr-2 border-r border-gray-100 dark:border-gray-700">
                        {[
                          { label: "Sum", val: s.sum, color: "text-emerald-600 dark:text-emerald-400" },
                          { label: "Average", val: s.avg, color: "text-blue-600 dark:text-blue-400" },
                          { label: "Median", val: s.median, color: "text-purple-600 dark:text-purple-400" },
                        ].map(({ label, val, color }) => (
                          <div key={label}>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{label}</p>
                            <p className={`text-sm font-bold ${color}`}>{fmt(val)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3 pl-2">
                        {[
                          { label: "Min", val: s.min },
                          { label: "Max", val: s.max },
                          { label: "Range", val: s.range },
                          { label: "Std dev (σ)", val: s.stdDev },
                        ].map(({ label, val }) => (
                          <div key={label}>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{label}</p>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{fmt(val)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsReport;
