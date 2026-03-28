import React from "react";

function GroupByReport({ aggData, aggregation, gName, cName }) {
  if (!aggData || aggData.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 italic">
        No valid numeric data found to aggregate.
      </div>
    );
  }

  const maxVal = Math.max(...aggData.map((d) => d.value));
  const fmt = (n) =>
    Number.isInteger(n)
      ? n.toLocaleString()
      : n.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-gray-900">Pivot Analysis</h3>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-bold text-blue-600 uppercase tracking-wider text-[11px] bg-blue-50 px-2 py-0.5 rounded">
              {aggregation}
            </span>{" "}
            of <strong className="text-gray-700">{cName}</strong> grouped by{" "}
            <strong className="text-gray-700">{gName}</strong>
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {aggData.map((item, index) => {
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex justify-between items-end text-sm">
                <span className="font-medium text-gray-700 truncate max-w-[65%]">
                  {item.label}
                </span>
                <span className="text-gray-900 font-black text-sm">
                  {fmt(item.value)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(item.value / maxVal) * 100}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GroupByReport;
