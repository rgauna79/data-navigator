import React from "react";

function StatisticsReport({ filteredData, totalRows, includedOptions }) {
  const calculateAverage = (columnIndex) => {
    const values = filteredData
      .map((row) => parseFloat(row[columnIndex]))
      .filter((v) => !isNaN(v));
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  const calculateSum = (columnIndex) => {
    const values = filteredData
      .map((row) => parseFloat(row[columnIndex]))
      .filter((v) => !isNaN(v));
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0).toFixed(2);
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
      {includedOptions.map((option, index) => {
        // option format is "columnName: value" — extract column index
        const columnIndex = index;
        const avg = calculateAverage(columnIndex);
        const sum = calculateSum(columnIndex);
        if (avg === null && sum === null) return null;

        return (
          <div key={option} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {option}
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
      })}
    </div>
  );
}

export default StatisticsReport;