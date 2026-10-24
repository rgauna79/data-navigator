// mostRepeatedOptions: [[valor, cantidad], ...] ordenados de mayor a menor
// totalValidRows: filas con valor en la columna (para el porcentaje)
// onDrill(valor): muestra las filas con ese valor
import { useI18n } from "../../i18n/I18nContext.jsx";

function MostRepeatedReport({ column, mostRepeatedOptions, totalValidRows, onDrill }) {
  const { t, fmtNumber } = useI18n();
  if (!mostRepeatedOptions || mostRepeatedOptions.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">{t("No data to display.")}</p>;
  }

  const max = mostRepeatedOptions[0][1] || 1;
  const total = totalValidRows || mostRepeatedOptions.reduce((acc, [, count]) => acc + count, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h3 className="text-base font-bold text-gray-800 dark:text-white">
          {column
            ? t("Top {n} most repeated values in {column}", { n: mostRepeatedOptions.length, column })
            : t("Top {n} most repeated values", { n: mostRepeatedOptions.length })}
        </h3>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
          {t("Based on {count} records with a value", { count: fmtNumber(total) })}
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
                {onDrill ? (
                  <button
                    onClick={() => onDrill(option)}
                    title={t("See the rows with this value")}
                    className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate text-left hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {option}
                  </button>
                ) : (
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{option}</span>
                )}
                <span className="ml-2 shrink-0 text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtNumber(count)}</span>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider ml-2">
                    {fmtNumber(total > 0 ? (count / total) * 100 : 0, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
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
