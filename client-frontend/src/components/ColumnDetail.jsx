import { useEffect, useMemo, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import "../utils/chartSetup.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { blankRows } from "../utils/cleanup.js";
import { isOutlier, numericProfile } from "../utils/columnProfile.js";
import { dataRows, getHeaders, parseDate, toNumber } from "../utils/excelUtils.js";
import { formatPeriodLabel, histogram, periodOf } from "../utils/reportUtils.js";
import DrillDownModal from "./reports/DrillDownModal.jsx";

const BLUE = { backgroundColor: "rgba(59,130,246,0.55)", borderColor: "rgba(59,130,246,1)", borderWidth: 1, borderRadius: 3 };
const PURPLE = { backgroundColor: "rgba(168,85,247,0.55)", borderColor: "rgba(168,85,247,1)", borderWidth: 1, borderRadius: 3 };

const chartOptions = (tooltipLabel) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${tooltipLabel(ctx.raw)}` } } },
  scales: { y: { beginAtZero: true, ticks: { maxTicksLimit: 5 } }, x: { ticks: { maxRotation: 0, autoSkip: true } } },
});

const statBox = "bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2";
const statLabel = "text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase";
const statValue = "text-sm font-bold text-gray-800 dark:text-gray-100";
const linkButton = "text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline";

function Block({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

// Totales por mes ("2024-03") de una columna de fecha; value(row) da lo que suma cada fila
const byMonth = (rows, dateIdx, dateOrder, value) => {
  const totals = new Map();
  for (const row of rows) {
    const d = parseDate(row[dateIdx], dateOrder);
    const v = value(row);
    if (!d || isNaN(v)) continue;
    const { key } = periodOf(d, "month");
    totals.set(key, (totals.get(key) || 0) + v);
  }
  return [...totals].sort(([a], [b]) => a.localeCompare(b));
};

function NumericDetail({ col, rows, dateCol, columnTypes, onDrill }) {
  const { t, tn, fmtNumber, locale } = useI18n();
  const fmt = (n) => fmtNumber(n, { maximumFractionDigits: 2 });
  const values = useMemo(
    () => rows.map((row) => toNumber(row[col.index], col.decimal)).filter((n) => !isNaN(n)),
    [rows, col]
  );
  const profile = useMemo(() => numericProfile(values), [values]);
  const outliers = useMemo(
    () => rows.filter((row) => {
      const n = toNumber(row[col.index], col.decimal);
      return !isNaN(n) && isOutlier(n, profile);
    }),
    [rows, col, profile]
  );
  const bins = useMemo(() => histogram(values, 20), [values]);
  const trend = useMemo(
    () =>
      dateCol
        ? byMonth(rows, dateCol.index, columnTypes[dateCol.index]?.dateOrder, (row) => toNumber(row[col.index], col.decimal))
        : [],
    [rows, dateCol, columnTypes, col]
  );

  if (values.length === 0) return <p className="text-sm text-gray-500">{t("This column has no numbers.")}</p>;

  const width = bins.length ? bins[0].to - bins[0].from : 0;
  const digits = width >= 10 ? 0 : width >= 1 ? 1 : 2;
  const fmtBin = (n) => fmtNumber(n, { maximumFractionDigits: digits, notation: Math.abs(n) >= 1e6 ? "compact" : "standard" });

  return (
    <div className="space-y-6">
      <Block title={t("Percentiles")}>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: t("Min"), value: col.min },
            { label: "P10", value: profile.p10 },
            { label: "P25", value: profile.p25 },
            { label: t("Median"), value: profile.p50 },
            { label: "P75", value: profile.p75 },
            { label: "P90", value: profile.p90 },
            { label: t("Max"), value: col.max },
            { label: t("Avg"), value: col.avg },
            { label: t("Sum"), value: col.sum },
          ].map(({ label, value }) => (
            <div key={label} className={statBox}>
              <p className={statLabel}>{label}</p>
              <p className={statValue}>{fmt(value)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("Half of the values are between {low} and {high}.", { low: fmt(profile.p25), high: fmt(profile.p75) })}
        </p>
      </Block>

      {bins.length > 1 && (
        <Block title={t("Distribution")}>
          <div className="h-56" role="img" aria-label={t("Distribution of {name}", { name: col.name })}>
            <Bar
              data={{
                labels: bins.map((b) => `${fmtBin(b.from)} – ${fmtBin(b.to)}`),
                datasets: [{ label: t("Values"), data: bins.map((b) => b.count), ...BLUE, barPercentage: 1, categoryPercentage: 0.95 }],
              }}
              options={chartOptions((n) => tn("{count} value", "{count} values", n))}
            />
          </div>
        </Block>
      )}

      <Block title={t("Unusual values")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {outliers.length
              ? profile.low < col.min
                ? tn("{count} value is above {high}.", "{count} values are above {high}.", outliers.length, { high: fmt(profile.high) })
                : profile.high > col.max
                ? tn("{count} value is below {low}.", "{count} values are below {low}.", outliers.length, { low: fmt(profile.low) })
                : tn(
                    "{count} value is below {low} or above {high}.",
                    "{count} values are below {low} or above {high}.",
                    outliers.length,
                    { low: fmt(profile.low), high: fmt(profile.high) }
                  )
              : t("No unusual values: every number is close to the rest.")}
          </p>
          {outliers.length > 0 && (
            <button onClick={() => onDrill(t("Unusual values of {column}", { column: col.name }), outliers)} className={linkButton}>
              {t("See them")}
            </button>
          )}
        </div>
      </Block>

      {trend.length > 1 && (
        <Block title={t("Total per month ({date})", { date: dateCol.name })}>
          <div className="h-48" role="img" aria-label={t("Total per month ({date})", { date: dateCol.name })}>
            <Line
              data={{
                labels: trend.map(([key]) => formatPeriodLabel(key, "month", locale, t)),
                datasets: [{
                  label: col.name,
                  data: trend.map(([, v]) => v),
                  borderColor: "rgba(59,130,246,1)",
                  backgroundColor: "rgba(59,130,246,0.15)",
                  fill: true,
                  cubicInterpolationMode: "monotone",
                }],
              }}
              options={chartOptions((n) => fmt(n))}
            />
          </div>
        </Block>
      )}
    </div>
  );
}

function CategoryDetail({ col, rows, onDrill }) {
  const { t, fmtNumber } = useI18n();
  const [search, setSearch] = useState("");
  const counts = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      const v = row[col.index];
      if (v === "" || v == null) continue;
      map.set(String(v), (map.get(String(v)) || 0) + 1);
    }
    return [...map].sort((a, b) => b[1] - a[1]);
  }, [rows, col]);
  const total = counts.reduce((sum, [, n]) => sum + n, 0) || 1;
  const visible = counts.filter(([v]) => v.toLowerCase().includes(search.trim().toLowerCase()));
  const max = counts[0]?.[1] || 1;

  return (
    <Block title={t("All values ({count})", { count: fmtNumber(counts.length) })}>
      <div className="relative">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search values...")}
          aria-label={t("Search values...")}
          className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="max-h-80 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 text-[11px] uppercase text-gray-500">
            <tr>
              <th className="text-left px-3 py-2">{t("Value")}</th>
              <th className="text-right px-3 py-2">{t("Rows")}</th>
              <th className="text-right px-3 py-2 w-40">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {visible.slice(0, 500).map(([value, n]) => (
              <tr key={value}>
                <td className="px-3 py-1.5 max-w-0 w-full">
                  <button
                    onClick={() => onDrill(`${col.name}: ${value}`, rows.filter((row) => String(row[col.index]) === value))}
                    title={t("See the rows with this value")}
                    className="block truncate max-w-full text-left font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {value}
                  </button>
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums font-bold text-gray-900 dark:text-white">{fmtNumber(n)}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center gap-2 justify-end">
                    <div className="h-1.5 w-20 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(n / max) * 100}%` }} />
                    </div>
                    <span className="tabular-nums text-xs text-gray-500 w-12 text-right">
                      {fmtNumber((n / total) * 100, { maximumFractionDigits: 1 })}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="text-sm text-gray-500 text-center py-4">{t("No values match.")}</p>}
      </div>
    </Block>
  );
}

function DateDetail({ col, rows, onDrill }) {
  const { t, tn, locale } = useI18n();
  const months = useMemo(() => byMonth(rows, col.index, col.dateOrder, () => 1), [rows, col]);
  const weekdays = useMemo(() => {
    const counts = Array(7).fill(0);
    for (const row of rows) {
      const d = parseDate(row[col.index], col.dateOrder);
      if (d) counts[(d.getDay() + 6) % 7]++; // lunes primero
    }
    return counts;
  }, [rows, col]);
  // 2024-01-01 fue lunes
  const dayNames = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "short" }));
  const label = (n) => tn("{count} row", "{count} rows", n);

  return (
    <div className="space-y-6">
      {months.length > 0 && (
        <Block title={t("Rows per month")}>
          <div className="h-56" role="img" aria-label={t("Rows per month")}>
            <Bar
              data={{
                labels: months.map(([key]) => formatPeriodLabel(key, "month", locale, t)),
                datasets: [{ label: t("Rows"), data: months.map(([, n]) => n), ...PURPLE }],
              }}
              options={{
                ...chartOptions(label),
                onClick: (_, elements) => {
                  const point = elements[0];
                  if (!point) return;
                  const key = months[point.index][0];
                  onDrill(
                    formatPeriodLabel(key, "month", locale, t),
                    rows.filter((row) => {
                      const d = parseDate(row[col.index], col.dateOrder);
                      return d && periodOf(d, "month").key === key;
                    })
                  );
                },
                onHover: (e, elements) => {
                  e.native.target.style.cursor = elements.length ? "pointer" : "default";
                },
              }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("Click a bar to see the rows of that month.")}</p>
        </Block>
      )}
      <Block title={t("Rows per weekday")}>
        <div className="h-44" role="img" aria-label={t("Rows per weekday")}>
          <Bar
            data={{ labels: dayNames, datasets: [{ label: t("Rows"), data: weekdays, ...PURPLE }] }}
            options={chartOptions(label)}
          />
        </div>
      </Block>
    </div>
  );
}

// Detalle de una columna del resumen: percentiles, distribución, valores
// atípicos y tendencia (números); todos los valores (textos); filas por mes y
// por día de la semana (fechas). Cada resultado permite ver sus filas.
// col: elemento de analyzeColumns; fileData: filas de la hoja con encabezados
function ColumnDetail({ col, fileData, analysis, columnTypes, onClose }) {
  const { t, tn } = useI18n();
  const [drill, setDrill] = useState(null);
  const rows = useMemo(() => dataRows(fileData), [fileData]);
  const headers = useMemo(() => getHeaders(fileData), [fileData]);
  const blanks = useMemo(() => blankRows(fileData, col.index), [fileData, col]);
  const dateCol = analysis.find((c) => c.type === "date" && c.count > 0 && c.index !== col.index);
  const onDrill = (title, subset) => setDrill({ title, rows: subset });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !drill && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, drill]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-xs flex justify-center items-start sm:items-center p-2 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      {drill && (
        <DrillDownModal
          title={drill.title}
          headers={headers}
          rows={drill.rows}
          columnTypes={columnTypes}
          onClose={() => setDrill(null)}
        />
      )}
      <div role="dialog" aria-modal="true" aria-labelledby="column-detail-title"
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-100 dark:border-gray-700 rounded-t-3xl">
          <div className="min-w-0">
            <h2 id="column-detail-title" className="text-lg font-black text-gray-900 dark:text-white truncate">{col.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tn("{count} value", "{count} values", col.count)} · {tn("{count} unique", "{count} unique", col.unique)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {col.type === "numeric" ? (
            <NumericDetail col={col} rows={rows} dateCol={dateCol} columnTypes={columnTypes} onDrill={onDrill} />
          ) : col.type === "date" ? (
            <DateDetail col={col} rows={rows} onDrill={onDrill} />
          ) : (
            <CategoryDetail col={col} rows={rows} onDrill={onDrill} />
          )}

          <Block title={t("Empty cells")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {blanks.length
                  ? tn("{count} row has this cell empty.", "{count} rows have this cell empty.", blanks.length)
                  : t("No empty cells in this column.")}
              </p>
              {blanks.length > 0 && (
                <button
                  onClick={() => onDrill(t("Empty {column}", { column: col.name }), blanks.map((i) => fileData[i]))}
                  className={linkButton}
                >
                  {t("See them")}
                </button>
              )}
            </div>
          </Block>
        </div>
      </div>
    </div>
  );
}

export default ColumnDetail;
