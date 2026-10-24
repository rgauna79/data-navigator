import { Bar } from "react-chartjs-2";
import { isNumericColumn, minMax, numericValues, spread } from "../../utils/excelUtils.js";
import { histogram } from "../../utils/reportUtils.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

// Distribución de una columna numérica: cuántos valores caen en cada intervalo
function Histogram({ values, name }) {
  const { t, tn, fmtNumber } = useI18n();
  const bins = histogram(values);
  if (bins.length < 2) return null;
  // Decimales de las etiquetas según el ancho de los intervalos
  const width = bins[0].to - bins[0].from;
  const digits = width >= 10 ? 0 : width >= 1 ? 1 : 2;
  const fmt = (n) => fmtNumber(n, { maximumFractionDigits: digits, notation: Math.abs(n) >= 1e6 ? "compact" : "standard" });
  const labels = bins.map((b) => `${fmt(b.from)} – ${fmt(b.to)}`);
  return (
    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">{t("Distribution")}</p>
      <div className="h-36" role="img" aria-label={t("Distribution of {name}", { name })}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: t("Values"),
                data: bins.map((b) => b.count),
                backgroundColor: "rgba(59,130,246,0.55)",
                borderColor: "rgba(59,130,246,1)",
                borderWidth: 1,
                borderRadius: 3,
                barPercentage: 1,
                categoryPercentage: 0.95,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx) => ` ${tn("{count} value", "{count} values", ctx.raw)}` } },
            },
            scales: {
              x: { ticks: { display: false }, grid: { display: false } },
              y: { beginAtZero: true, ticks: { precision: 0, maxTicksLimit: 4 } },
            },
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{fmt(bins[0].from)}</span>
        <span>{fmt(bins.at(-1).to)}</span>
      </div>
    </div>
  );
}

// numericColumns: índices de las columnas numéricas (según el tipo de cada
// columna, incluidas las correcciones del usuario); si no se pasa, se detecta
// decimalOf(índice): separador decimal de la columna ("." o ",")
function StatisticsReport({ filteredData, totalRows, includedOptions, headers, numericColumns, decimalOf = () => undefined }) {
  const { t, tn, fmtNumber, fmtDecimal } = useI18n();
  const nCols = headers?.length || filteredData[0]?.length || 0;
  const numericCols =
    numericColumns ??
    [...Array(nCols).keys()].filter((idx) => isNumericColumn(filteredData.map((row) => row[idx])));

  const columnName = (idx) => headers?.[idx] || t("Column {n}", { n: idx + 1 });
  const fmt = (n) => (n === undefined || n === null || isNaN(n) ? "—" : fmtDecimal(n));

  const stats = (columnIndex) => {
    const cells = filteredData.map((row) => row[columnIndex]);
    const values = numericValues(cells, decimalOf(columnIndex));
    if (values.length === 0) return null;
    const blank = cells.filter((v) => v === "" || v == null).length;
    const sum = values.reduce((a, b) => a + b, 0);
    const { min, max } = minMax(values);
    const { median, stdDev } = spread(values);
    return {
      values, sum, avg: sum / values.length, median, min, max, range: max - min, stdDev,
      count: values.length, blank, invalid: cells.length - blank - values.length,
    };
  };

  return (
    <div className="space-y-5">
      {/* Filters applied */}
      {includedOptions.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {t("Filters applied")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {includedOptions.map((option) => (
              <span
                key={option}
                className="inline-flex items-center text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2.5 py-1"
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Total rows */}
      <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-4 flex items-center justify-between border border-gray-100 dark:border-gray-700 shadow-xs">
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t("Total matching rows")}</span>
        <span className="text-2xl font-black text-gray-900 dark:text-white">{fmtNumber(totalRows)}</span>
      </div>

      {/* Numeric stats per column */}
      {numericCols.length === 0 ? (
        <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-500 dark:text-gray-400">
          {t("No numeric columns to summarize.")}
        </div>
      ) : (
        <div>
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            {t("Numeric columns")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numericCols.map((idx) => {
              const s = stats(idx);
              return (
                <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-xs">
                  <p className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 truncate">
                    {columnName(idx)}
                  </p>
                  {!s ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("No numeric values.")}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <div className="space-y-3 pr-2 border-r border-gray-100 dark:border-gray-700">
                        {[
                          { label: t("Sum"), val: s.sum, color: "text-emerald-600 dark:text-emerald-400" },
                          { label: t("Average"), val: s.avg, color: "text-blue-600 dark:text-blue-400" },
                          { label: t("Median"), val: s.median, color: "text-purple-600 dark:text-purple-400" },
                        ].map(({ label, val, color }) => (
                          <div key={label}>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{label}</p>
                            <p className={`text-sm font-bold ${color}`}>{fmt(val)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3 pl-2">
                        {[
                          { label: t("Min"), val: s.min },
                          { label: t("Max"), val: s.max },
                          { label: t("Range"), val: s.range },
                          { label: t("Std dev"), val: s.stdDev, title: t("Sample standard deviation (Excel STDEV.S)") },
                        ].map(({ label, val, title }) => (
                          <div key={label} title={title}>
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{label}</p>
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{fmt(val)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {s && <Histogram values={s.values} name={columnName(idx)} />}
                  {s && (
                    <p className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-500 dark:text-gray-400">
                      {tn("{count} value", "{count} values", s.count)}
                      {s.blank > 0 && ` · ${tn("{count} blank", "{count} blank", s.blank)}`}
                      {s.invalid > 0 && (
                        <span className="text-amber-600 dark:text-amber-400">
                          {" "}· {tn("{count} not a number (ignored)", "{count} not numbers (ignored)", s.invalid)}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatisticsReport;
