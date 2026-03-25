import React from "react";

function MostRepeatedReport({ mostRepeatedOptions }) {
  const max = mostRepeatedOptions[0]?.[1] || 1;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Top {mostRepeatedOptions.length} most repeated values
      </h3>
      <div className="space-y-2">
        {mostRepeatedOptions.map(([option, count], index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-5 text-xs font-bold text-gray-400 dark:text-gray-500 text-right flex-shrink-0">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{option}</span>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 ml-2 flex-shrink-0">
                  {count}
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MostRepeatedReport;