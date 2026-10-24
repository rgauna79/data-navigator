import { useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendDown, faArrowTrendUp, faChartBar, faChartLine, faChartPie, faFileCsv, faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { BLANK_LABEL, METRICS, PERIODS, downloadCsv, formatPeriodLabel } from "../../utils/reportUtils.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

const PALETTE = [
  "59,130,246", "16,185,129", "245,158,11", "239,68,68", "139,92,246",
  "236,72,153", "20,184,166", "234,88,12", "99,102,241", "132,204,22",
];
const OTHER_COLOR = "156,163,175";

// Resultado del informe "Group & summarize": gráfico, tabla y exportación a CSV.
// result: salida de groupRows; config: configuración elegida en el Modal.
// onDrill(grupo, etiqueta): muestra las filas de un grupo (clic en la tabla o el gráfico)
function GroupReport({ result, config, headers, includedOptions, rowCount, onDrill }) {
  const { groups, total, skipped } = result;
  const { t, tn, locale, fmtNumber, fmtDecimal } = useI18n();
  const formatValue = (value) =>
    value === null || value === undefined ? "—" : metric === "count" ? fmtNumber(value) : fmtDecimal(value);
  const { metric, groupType, period, groupIdx, valueIdx } = config;
  const isDate = groupType === "date";
  const additive = metric === "count" || metric === "sum";
  // La torta solo tiene sentido para partes de un total sin valores negativos
  const canPie = !isDate && additive && groups.every((g) => (g.value ?? 0) >= 0);
  const [chartType, setChartType] = useState(isDate ? "line" : "bar");

  const groupName = headers?.[groupIdx] ?? t("Column {n}", { n: groupIdx + 1 });
  const valueName = valueIdx != null ? headers?.[valueIdx] ?? t("Column {n}", { n: valueIdx + 1 }) : null;
  const metricLabel =
    metric === "count" ? t("Count of rows") : t("{metric} of {column}", { metric: t(METRICS[metric]), column: valueName });
  const byLabel = t("{metric} by {group}", { metric: metricLabel, group: groupName });
  const title = isDate ? t("{title} (per {period})", { title: byLabel, period: t(PERIODS[period]).toLowerCase() }) : byLabel;
  const showShare = additive && total > 0;
  // Con "count" la columna de filas repetiría el mismo número que el valor
  const showRows = metric !== "count";
  const share = (value) =>
    showShare && value != null ? `${fmtNumber((value / total) * 100, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%` : "";
  const pct = (n) => `${n > 0 ? "+" : ""}${fmtNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

  // Variación respecto al período anterior (solo al agrupar por fecha)
  const changeAt = (i) => {
    const prev = groups[i - 1];
    const cur = groups[i];
    if (!isDate || !prev || prev.value == null || cur.value == null || prev.value === 0) return null;
    return ((cur.value - prev.value) / Math.abs(prev.value)) * 100;
  };
  const lastChange = isDate && groups.length > 1 ? changeAt(groups.length - 1) : null;

  // Etiqueta de cada grupo en el idioma de la interfaz
  const labelOf = (g) => {
    if (g.isOther) return tn("Other ({count} group)", "Other ({count} groups)", g.groupCount);
    if (isDate) return formatPeriodLabel(g.key, period, locale, t);
    return g.key === BLANK_LABEL ? t("(blank)") : g.label;
  };

  const tabs = [
    { id: "bar", label: t("Bar"), icon: faChartBar },
    { id: "line", label: t("Line"), icon: faChartLine },
    ...(canPie ? [{ id: "pie", label: t("Pie"), icon: faChartPie }] : []),
  ];
  const activeChart = tabs.some((tab) => tab.id === chartType) ? chartType : tabs[0].id;

  const colorFor = (g, i, alpha) =>
    `rgba(${g.isOther ? OTHER_COLOR : isDate ? PALETTE[0] : PALETTE[i % PALETTE.length]},${alpha})`;

  const chartData = {
    labels: groups.map(labelOf),
    datasets: [
      {
        label: metricLabel,
        data: groups.map((g) => g.value),
        backgroundColor:
          activeChart === "line" ? "rgba(59,130,246,0.1)" : groups.map((g, i) => colorFor(g, i, 0.7)),
        borderColor: activeChart === "line" ? "rgba(59,130,246,1)" : groups.map((g, i) => colorFor(g, i, 1)),
        borderWidth: activeChart === "line" ? 2 : 1,
        borderRadius: activeChart === "bar" ? 6 : 0,
        // Las barras y porciones se pueden pulsar para ver sus filas
        hoverBackgroundColor:
          activeChart === "line" ? undefined : groups.map((g, i) => colorFor(g, i, 0.9)),
        fill: activeChart === "line",
        tension: 0.3,
        // Suaviza sin pasarse de los valores reales (evita picos inexistentes)
        cubicInterpolationMode: "monotone",
        pointRadius: 3,
        spanGaps: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (onDrill && elements.length) onDrill(groups[elements[0].index], labelOf(groups[elements[0].index]));
    },
    onHover: (event, elements) => {
      if (event.native?.target) event.native.target.style.cursor = onDrill && elements.length ? "pointer" : "default";
    },
    plugins: {
      legend: { display: activeChart === "pie", position: "left" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const g = groups[ctx.dataIndex];
            const extra = share(g.value);
            return ` ${formatValue(g.value)}${extra ? ` (${extra})` : ""}`;
          },
        },
      },
    },
    ...(activeChart !== "pie" && {
      scales: {
        y: {
          beginAtZero: true,
          // Un conteo no tiene decimales
          ticks: metric === "count" ? { precision: 0 } : {},
        },
      },
    }),
  };

  const handleDownload = () => {
    const rows = [
      [groupName, metricLabel, t("Rows"), ...(showShare ? [t("% of total")] : [])],
      ...groups.map((g) => [
        labelOf(g),
        g.value ?? "",
        g.rows,
        ...(showShare ? [g.value != null ? ((g.value / total) * 100).toFixed(1) : ""] : []),
      ]),
      [t("Total"), total ?? "", groups.reduce((n, g) => n + g.rows, 0), ...(showShare ? ["100.0"] : [])],
    ];
    const safeName = title.normalize("NFD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").toLowerCase();
    downloadCsv(`${safeName || "report"}.csv`, rows);
  };

  const ChartComponent = { bar: Bar, line: Line, pie: Pie }[activeChart];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        {includedOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {includedOptions.map((option) => (
              <span
                key={option}
                className="inline-flex items-center text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2.5 py-1"
              >
                {option}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Resumen */}
      <div className={`grid grid-cols-1 gap-3 ${lastChange !== null ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"}`}>
        {[
          { label: t("Groups"), value: fmtNumber(groups.filter((g) => g.rows > 0).length) },
          { label: t("Rows"), value: fmtNumber(rowCount) },
          { label: metric === "count" ? t("Total rows") : t("{metric} (all)", { metric: t(METRICS[metric]) }), value: formatValue(total) },
          ...(lastChange !== null
            ? [{
                label: t("{last} vs {previous}", { last: labelOf(groups.at(-1)), previous: labelOf(groups.at(-2)) }),
                value: pct(lastChange),
                tone: lastChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              }]
            : []),
        ].map(({ label, value, tone }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3 min-w-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={label}>{label}</p>
            <p className={`text-lg font-bold truncate ${tone || "text-gray-900 dark:text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {skipped > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          {tn(
            "{count} row without a valid date in {column} was left out.",
            "{count} rows without a valid date in {column} were left out.",
            skipped,
            { column: groupName }
          )}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("No rows match the selected filters.")}</p>
      ) : (
        <>
          {/* Gráfico */}
          <div>
            <div className="flex items-center gap-1 mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
              {tabs.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setChartType(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeChart === id
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <FontAwesomeIcon icon={icon} className="text-xs" />
                  {label}
                </button>
              ))}
            </div>
            <div className="h-72">
              <ChartComponent data={chartData} options={chartOptions} />
            </div>
            {onDrill && (
              <p className="text-xs text-gray-400 mt-2" data-html2canvas-ignore>
                {t("Click a bar or a row to see the rows behind it.")}
              </p>
            )}
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">{groupName}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{metricLabel}</th>
                  {showRows && <th className="px-4 py-2.5 text-right font-medium">{t("Rows")}</th>}
                  {showShare && <th className="px-4 py-2.5 text-right font-medium">{t("% of total")}</th>}
                  {isDate && <th className="px-4 py-2.5 text-right font-medium">{t("vs previous")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {groups.map((g, i) => (
                  <tr
                    key={g.key}
                    className={`${g.isOther ? "italic text-gray-500 dark:text-gray-400" : ""} ${
                      onDrill && g.rows > 0 ? "hover:bg-blue-50/60 dark:hover:bg-blue-900/20" : ""
                    }`}
                  >
                    <td className="px-4 py-2">
                      {onDrill && g.rows > 0 ? (
                        <button
                          onClick={() => onDrill(g, labelOf(g))}
                          className="group flex items-center gap-2 text-left hover:text-blue-600 dark:hover:text-blue-400"
                          title={t("See the rows of this group")}
                        >
                          {labelOf(g)}
                          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[10px] opacity-0 group-hover:opacity-100" />
                        </button>
                      ) : (
                        labelOf(g)
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatValue(g.value)}</td>
                    {showRows && <td className="px-4 py-2 text-right tabular-nums">{fmtNumber(g.rows)}</td>}
                    {showShare && <td className="px-4 py-2 text-right tabular-nums">{share(g.value)}</td>}
                    {isDate && (
                      <td className="px-4 py-2 text-right tabular-nums whitespace-nowrap">
                        {changeAt(i) === null ? (
                          <span className="text-gray-300 dark:text-gray-600">—</span>
                        ) : (
                          <span className={changeAt(i) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                            <FontAwesomeIcon icon={changeAt(i) >= 0 ? faArrowTrendUp : faArrowTrendDown} className="text-[10px] mr-1" />
                            {pct(changeAt(i))}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/40 font-semibold text-gray-900 dark:text-white">
                <tr>
                  <td className="px-4 py-2">{t("Total")}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatValue(total)}</td>
                  {showRows && (
                    <td className="px-4 py-2 text-right tabular-nums">
                      {fmtNumber(groups.reduce((n, g) => n + g.rows, 0))}
                    </td>
                  )}
                  {showShare && <td className="px-4 py-2 text-right tabular-nums">{fmtNumber(100, { minimumFractionDigits: 1 })}%</td>}
                  {isDate && <td />}
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end" data-html2canvas-ignore>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={faFileCsv} /> {t("Download CSV")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupReport;
