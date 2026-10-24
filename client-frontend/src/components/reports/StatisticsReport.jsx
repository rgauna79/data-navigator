import { isNumericColumn, numericValues } from "../../utils/excelUtils.js";

const fmt = (n) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
    if (values.length === 0) return { avg: null, sum: null };
    const sum = values.reduce((a, b) => a + b, 0);
    return { avg: fmt(sum / values.length), sum: fmt(sum) };
  };

  return (
    <div className="space-y-4">
      {/* Filters applied */}
      {includedOptions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Filters applied
          </p>
          <div className="flex flex-wrap gap-1.5">
            {includedOptions.map((option) => (
              <span
                key={option}
                className="inline-flex items-center text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2.5 py-1"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Total rows */}
      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">Total matching rows</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalRows}</span>
      </div>

      {/* Numeric stats per column */}
      {numericCols.length === 0 ? (
        <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-500 dark:text-gray-400">
          No numeric columns to summarize.
        </div>
      ) : (
        numericCols.map((idx) => {
          const { avg, sum } = stats(idx);
          return (
            <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {columnName(idx)}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {avg !== null && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Average</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{avg}</p>
                  </div>
                )}
                {sum !== null && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-0.5">Sum</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{sum}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default StatisticsReport;
