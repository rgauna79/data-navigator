import { useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar, faChartLine, faChartPie, faFileCsv } from "@fortawesome/free-solid-svg-icons";
import { METRICS, PERIODS, downloadCsv } from "../../utils/reportUtils.js";

const PALETTE = [
  "59,130,246", "16,185,129", "245,158,11", "239,68,68", "139,92,246",
  "236,72,153", "20,184,166", "234,88,12", "99,102,241", "132,204,22",
];
const OTHER_COLOR = "156,163,175";

const formatValue = (value, metric) => {
  if (value === null || value === undefined) return "—";
  return metric === "count"
    ? value.toLocaleString("en-US")
    : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Resultado del informe "Group & summarize": gráfico, tabla y exportación a CSV.
// result: salida de groupRows; config: configuración elegida en el Modal.
function GroupReport({ result, config, headers, includedOptions, rowCount }) {
  const { groups, total, skipped } = result;
  const { metric, groupType, period, groupIdx, valueIdx } = config;
  const isDate = groupType === "date";
  const additive = metric === "count" || metric === "sum";
  // La torta solo tiene sentido para partes de un total sin valores negativos
  const canPie = !isDate && additive && groups.every((g) => (g.value ?? 0) >= 0);
  const [chartType, setChartType] = useState(isDate ? "line" : "bar");

  const groupName = headers?.[groupIdx] ?? `Column ${groupIdx + 1}`;
  const valueName = valueIdx != null ? headers?.[valueIdx] ?? `Column ${valueIdx + 1}` : null;
  const metricLabel = metric === "count" ? "Count of rows" : `${METRICS[metric]} of ${valueName}`;
  const title = `${metricLabel} by ${groupName}${isDate ? ` (per ${PERIODS[period].toLowerCase()})` : ""}`;
  const showShare = additive && total > 0;
  // Con "count" la columna de filas repetiría el mismo número que el valor
  const showRows = metric !== "count";
  const share = (value) => (showShare && value != null ? `${((value / total) * 100).toFixed(1)}%` : "");

  const tabs = [
    { id: "bar", label: "Bar", icon: faChartBar },
    { id: "line", label: "Line", icon: faChartLine },
    ...(canPie ? [{ id: "pie", label: "Pie", icon: faChartPie }] : []),
  ];
  const activeChart = tabs.some((t) => t.id === chartType) ? chartType : tabs[0].id;

  const colorFor = (g, i, alpha) =>
    `rgba(${g.isOther ? OTHER_COLOR : isDate ? PALETTE[0] : PALETTE[i % PALETTE.length]},${alpha})`;

  const chartData = {
    labels: groups.map((g) => g.label),
    datasets: [
      {
        label: metricLabel,
        data: groups.map((g) => g.value),
        backgroundColor:
          activeChart === "line" ? "rgba(59,130,246,0.1)" : groups.map((g, i) => colorFor(g, i, 0.7)),
        borderColor: activeChart === "line" ? "rgba(59,130,246,1)" : groups.map((g, i) => colorFor(g, i, 1)),
        borderWidth: activeChart === "line" ? 2 : 1,
        borderRadius: activeChart === "bar" ? 6 : 0,
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
    plugins: {
      legend: { display: activeChart === "pie", position: "left" },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const g = groups[ctx.dataIndex];
            const extra = share(g.value);
            return ` ${formatValue(g.value, metric)}${extra ? ` (${extra})` : ""}`;
          },
        },
      },
    },
    ...(activeChart !== "pie" && {
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.05)" },
          // Un conteo no tiene decimales
          ticks: metric === "count" ? { precision: 0 } : {},
        },
      },
    }),
  };

  const handleDownload = () => {
    const rows = [
      [groupName, metricLabel, "Rows", ...(showShare ? ["% of total"] : [])],
      ...groups.map((g) => [
        g.label,
        g.value ?? "",
        g.rows,
        ...(showShare ? [g.value != null ? ((g.value / total) * 100).toFixed(1) : ""] : []),
      ]),
      ["Total", total ?? "", groups.reduce((n, g) => n + g.rows, 0), ...(showShare ? ["100.0"] : [])],
    ];
    const safeName = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").toLowerCase();
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Groups", value: groups.filter((g) => g.rows > 0).length.toLocaleString("en-US") },
          { label: "Rows", value: rowCount.toLocaleString("en-US") },
          { label: metric === "count" ? "Total rows" : `${METRICS[metric]} (all)`, value: formatValue(total, metric) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      {skipped > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          {skipped.toLocaleString("en-US")} row{skipped === 1 ? "" : "s"} without a valid date in {groupName} were left out.
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No rows match the selected filters.</p>
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
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
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
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">{groupName}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{metricLabel}</th>
                  {showRows && <th className="px-4 py-2.5 text-right font-medium">Rows</th>}
                  {showShare && <th className="px-4 py-2.5 text-right font-medium">% of total</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {groups.map((g) => (
                  <tr key={g.key} className={g.isOther ? "italic text-gray-500 dark:text-gray-400" : ""}>
                    <td className="px-4 py-2">{g.label}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{formatValue(g.value, metric)}</td>
                    {showRows && <td className="px-4 py-2 text-right tabular-nums">{g.rows.toLocaleString("en-US")}</td>}
                    {showShare && <td className="px-4 py-2 text-right tabular-nums">{share(g.value)}</td>}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700/40 font-semibold text-gray-900 dark:text-white">
                <tr>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatValue(total, metric)}</td>
                  {showRows && (
                    <td className="px-4 py-2 text-right tabular-nums">
                      {groups.reduce((n, g) => n + g.rows, 0).toLocaleString("en-US")}
                    </td>
                  )}
                  {showShare && <td className="px-4 py-2 text-right tabular-nums">100.0%</td>}
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex justify-end" data-html2canvas-ignore>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={faFileCsv} /> Download CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupReport;
