import React from "react";

function StatisticsReport({ filteredData, totalRows, includedOptions }) {
  // ✅ FIX: calcular stats correctamente sobre filteredData como array de objetos
  const numericStats = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const isObjectRows = !Array.isArray(filteredData[0]);
    if (!isObjectRows) return []; // arrays sin headers — no podemos calcular

    const keys = Object.keys(filteredData[0]);
    return keys
      .map((key) => {
        const vals = filteredData
          .map((r) => parseFloat(r[key]))
          .filter((v) => !isNaN(v));
        if (vals.length === 0) return null;
        return {
          name: key,
          avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
          sum: vals.reduce((a, b) => a + b, 0).toFixed(2),
          min: Math.min(...vals),
          max: Math.max(...vals),
        };
      })
      .filter(Boolean);
  }, [filteredData]);

  return (
    <div className="space-y-4">
      {includedOptions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Filters applied
          </p>
          <div className="flex flex-wrap gap-1.5">
            {includedOptions.map((option) => (
              <span
                key={option}
                className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2.5 py-1"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Matching rows
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {totalRows}
        </span>
      </div>

      {numericStats.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Numeric column stats
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {numericStats.map((col) => (
              <div
                key={col.name}
                className="border border-gray-100 dark:border-gray-700 rounded-xl p-4"
              >
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 truncate">
                  {col.name}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Average",
                      val: col.avg,
                      cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                      vcls: "text-blue-700 dark:text-blue-300",
                    },
                    {
                      label: "Sum",
                      val: col.sum,
                      cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
                      vcls: "text-emerald-700 dark:text-emerald-300",
                    },
                    {
                      label: "Min",
                      val: col.min,
                      cls: "bg-gray-50 dark:bg-gray-700/50 text-gray-500",
                      vcls: "text-gray-700 dark:text-gray-300",
                    },
                    {
                      label: "Max",
                      val: col.max,
                      cls: "bg-gray-50 dark:bg-gray-700/50 text-gray-500",
                      vcls: "text-gray-700 dark:text-gray-300",
                    },
                  ].map(({ label, val, cls, vcls }) => (
                    <div key={label} className={`${cls} rounded-lg px-3 py-2`}>
                      <p className="text-xs mb-0.5">{label}</p>
                      <p className={`text-base font-bold ${vcls}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsReport;
