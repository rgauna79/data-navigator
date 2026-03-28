import React from "react";

function MostRepeatedReport({ mostRepeatedOptions, totalValidRows }) {
  if (!mostRepeatedOptions || mostRepeatedOptions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 italic">
        No data available for this selection.
      </div>
    );
  }

  const maxCount = mostRepeatedOptions[0][1];
  // Si no se pasa el total, usamos la suma de los top N como fallback
  const fallbackTotal = mostRepeatedOptions.reduce(
    (acc, [, count]) => acc + count,
    0
  );
  const total = totalValidRows || fallbackTotal;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Top {mostRepeatedOptions.length} Most Repeated Values
        </h3>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
          Based on {total.toLocaleString()} valid records
        </span>
      </div>

      <div className="space-y-5">
        {mostRepeatedOptions.map(([label, count], index) => {
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

          return (
            <div key={index} className="space-y-1.5">
              <div className="flex justify-between items-end text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[65%]">
                  {label || "(Empty)"}
                </span>
                <div className="text-right flex flex-col">
                  <span className="text-gray-900 dark:text-white font-bold text-sm">
                    {count.toLocaleString()}{" "}
                    <span className="text-gray-400 font-normal text-xs">
                      times
                    </span>
                  </span>
                  <span className="text-blue-500 font-bold text-[10px] uppercase tracking-wider">
                    {percentage}% of total
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MostRepeatedReport;
