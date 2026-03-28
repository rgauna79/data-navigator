import React, { useMemo } from "react";

const getMedian = (array) => {
  if (!array.length) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

const getStdDev = (array, mean) => {
  if (array.length < 2) return 0;
  const variance =
    array.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / array.length;
  return Math.sqrt(variance);
};

const cleanNumericValue = (val) => {
  if (typeof val === "number") return val;
  if (!val || typeof val !== "string") return NaN;
  const clean = val.trim().replace(/[$\s,]/g, "");
  if (clean.includes("/")) return NaN;
  return parseFloat(clean);
};

function StatisticsReport({
  filteredData,
  totalRows,
  includedOptions,
  headers,
}) {
  const numericStats = useMemo(() => {
    if (!filteredData || filteredData.length === 0 || !headers) return [];

    return headers
      .map((headerName, index) => {
        const vals = filteredData
          .map((r) => cleanNumericValue(r[index]))
          .filter((v) => !isNaN(v));

        // Asegurarnos de que tenga suficientes números para ser considerada numérica
        if (vals.length === 0 || vals.length < filteredData.length * 0.4)
          return null;

        const sum = vals.reduce((a, b) => a + b, 0);
        const avg = sum / vals.length;
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const median = getMedian(vals);
        const stdDev = getStdDev(vals, avg);
        const range = max - min;

        const fmt = (n) =>
          Number.isInteger(n)
            ? n.toLocaleString()
            : n.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

        return {
          name: headerName,
          avg: fmt(avg),
          sum: fmt(sum),
          median: fmt(median),
          min: fmt(min),
          max: fmt(max),
          range: fmt(range),
          stdDev: fmt(stdDev),
        };
      })
      .filter(Boolean);
  }, [filteredData, headers]);

  return (
    <div className="space-y-5">
      {includedOptions.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            Filters applied
          </p>
          <div className="flex flex-wrap gap-1.5">
            {includedOptions.map((option) => (
              <span
                key={option}
                className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl px-4 py-4 flex items-center justify-between border border-gray-100 shadow-sm">
        <span className="text-sm font-semibold text-gray-600">
          Matching rows for this report
        </span>
        <span className="text-2xl font-black text-gray-900">
          {totalRows.toLocaleString()}
        </span>
      </div>

      {numericStats.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Advanced Numeric Stats
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numericStats.map((col) => (
              <div
                key={col.name}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
              >
                <p className="text-xs font-black text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 truncate">
                  {col.name}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-3 pr-2 border-r border-gray-100">
                    {[
                      {
                        label: "Sum Total",
                        val: col.sum,
                        color: "text-emerald-600",
                      },
                      {
                        label: "Average",
                        val: col.avg,
                        color: "text-blue-600",
                      },
                      {
                        label: "Median",
                        val: col.median,
                        color: "text-purple-600",
                      },
                    ].map(({ label, val, color }) => (
                      <div key={label}>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {label}
                        </p>
                        <p className={`text-sm font-bold ${color}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pl-2">
                    {[
                      { label: "Min", val: col.min },
                      { label: "Max", val: col.max },
                      { label: "Range", val: col.range },
                      { label: "Std Dev (σ)", val: col.stdDev },
                    ].map(({ label, val }) => (
                      <div key={label}>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                          {label}
                        </p>
                        <p className="text-sm font-bold text-gray-700">{val}</p>
                      </div>
                    ))}
                  </div>
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
