import React from "react";

function MostRepeatedReport({ mostRepeatedOptions }) {
  if (!mostRepeatedOptions || mostRepeatedOptions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 italic">
        No data available for this selection.
      </div>
    );
  }

  // El primer elemento tiene la frecuencia más alta para escalar las barras
  const maxCount = mostRepeatedOptions[0][1];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          Top {mostRepeatedOptions.length} Most Repeated Values
        </h3>
      </div>

      <div className="space-y-4">
        {mostRepeatedOptions.map(([label, count], index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
                {label || "Empty"}
              </span>
              <span className="text-gray-500 font-mono text-xs">
                {count} times
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(count / maxCount) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MostRepeatedReport;
