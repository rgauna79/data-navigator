// mostRepeatedOptions: [[valor, cantidad], ...] ordenados de mayor a menor
// totalValidRows: filas con valor en la columna (para el porcentaje)
function MostRepeatedReport({ column, mostRepeatedOptions, totalValidRows }) {
  if (!mostRepeatedOptions || mostRepeatedOptions.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">No data to display.</p>;
  }

  const max = mostRepeatedOptions[0][1] || 1;
  const total = totalValidRows || mostRepeatedOptions.reduce((acc, [, count]) => acc + count, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h3 className="text-base font-bold text-gray-800 dark:text-white">
          Top {mostRepeatedOptions.length} most repeated values{column ? ` in ${column}` : ""}
        </h3>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
          Based on {total.toLocaleString("en-US")} records with a value
        </span>
      </div>
      <div className="space-y-4">
        {mostRepeatedOptions.map(([option, count], index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="w-5 text-xs font-bold text-gray-400 dark:text-gray-500 text-right shrink-0">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-end justify-between mb-1">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{option}</span>
                <span className="ml-2 shrink-0 text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{count.toLocaleString("en-US")}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider ml-2">
                    {total > 0 ? ((count / total) * 100).toFixed(1) : 0}%
                  </span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out"
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
