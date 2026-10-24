import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { saveReport } from "../api/reports.js";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Filler,
} from "chart.js";
// Colores de los gráficos según el modo claro/oscuro
import "../utils/chartTheme.js";
import { analyzeColumns, parseDate } from "../utils/excelUtils.js";
import { applyFilters, describeFilter, groupRows } from "../utils/reportUtils.js";
import StatisticsReport from "../components/reports/StatisticsReport.jsx";
import MostRepeatedReport from "../components/reports/MostRepeatedReport.jsx";
import GroupReport from "../components/reports/GroupReport.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf, faArrowLeft, faChartBar, faChartPie, faChartLine, faSpinner, faFloppyDisk, faFileExcel,
} from "@fortawesome/free-solid-svg-icons";

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, PointElement, LineElement, Title, Filler
);

const COLORS = [
  { bg: "rgba(59,130,246,0.7)",  border: "rgba(59,130,246,1)"  },
  { bg: "rgba(16,185,129,0.7)",  border: "rgba(16,185,129,1)"  },
  { bg: "rgba(245,158,11,0.7)",  border: "rgba(245,158,11,1)"  },
  { bg: "rgba(239,68,68,0.7)",   border: "rgba(239,68,68,1)"   },
  { bg: "rgba(139,92,246,0.7)",  border: "rgba(139,92,246,1)"  },
  { bg: "rgba(236,72,153,0.7)",  border: "rgba(236,72,153,1)"  },
  { bg: "rgba(20,184,166,0.7)",  border: "rgba(20,184,166,1)"  },
  { bg: "rgba(234,88,12,0.7)",   border: "rgba(234,88,12,1)"   },
  { bg: "rgba(99,102,241,0.7)",  border: "rgba(99,102,241,1)"  },
  { bg: "rgba(132,204,22,0.7)",  border: "rgba(132,204,22,1)"  },
];

const CHART_TABS = [
  { id: "pie",  label: "Pie",  icon: faChartPie  },
  { id: "bar",  label: "Bar",  icon: faChartBar  },
  { id: "line", label: "Trend",icon: faChartLine },
];

const REPORT_TITLES = {
  statistics: "Statistics report",
  mostRepeated: "Most repeated values",
  group: "Group & summarize",
};

// Pide el nombre del informe antes de guardarlo
function SaveReportModal({ defaultName, onConfirm, onCancel }) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onConfirm(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={handleConfirm}
        role="dialog"
        aria-labelledby="save-report-title"
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 w-full max-w-sm p-6"
      >
        <h3 id="save-report-title" className="text-lg font-black text-gray-900 dark:text-white mb-1">Save report</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Saved reports keep their data, so you can open them later from My Reports.
        </p>
        <label htmlFor="reportName" className="sr-only">Report name</label>
        <input
          id="reportName"
          autoFocus
          type="text"
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-bold mb-4 outline-hidden focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl"
          >
            <FontAwesomeIcon icon={saving ? faSpinner : faFloppyDisk} spin={saving} />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChartPage() {
  const {
    data, headers, selectedOptions, typeReport, config,
    reportColumnTypes: columnTypes, reportSheetName, isRestoringReport,
  } = useDataContext();
  const { isLoggedIn } = useAuth();
  const reportsRef = useRef();
  const navigate = useNavigate();
  const [chartType, setChartType] = useState("pie");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const columnName = (idx) => headers?.[idx] ?? `Column ${Number(idx) + 1}`;

  // Análisis de columnas de los datos del informe (no del archivo abierto en el lector)
  const analysis = useMemo(
    () => {
      if (!headers?.length) return [];
      const fileData = [headers, ...data];
      // Informes guardados antes de existir columnTypes: se detectan de nuevo
      return columnTypes ? analyzeColumns(fileData, columnTypes) : analyzeColumns(fileData);
    },
    [headers, data, columnTypes]
  );

  // "statistics" y "group" usan selectedOptions como filtros por columna
  const filteredData = useMemo(() => {
    if (typeReport !== "statistics" && typeReport !== "group") return data;
    return applyFilters(data, selectedOptions, analysis);
  }, [data, selectedOptions, typeReport, analysis]);

  const groupResult = useMemo(() => {
    if (typeReport !== "group" || !config) return null;
    return groupRows({
      ...config,
      rows: filteredData,
      dateOrder: analysis[config.groupIdx]?.dateOrder,
      decimal: config.valueIdx != null ? analysis[config.valueIdx]?.decimal : undefined,
    });
  }, [typeReport, config, filteredData, analysis]);

  const includedOptions = Object.entries(selectedOptions)
    .filter(([, v]) => v !== "" && v != null)
    .map(([idx, v]) => `${columnName(idx)}: ${describeFilter(v)}`);

  const handlePrint = async () => {
    try {
      if (!reportsRef.current) return;
      // Se cargan solo al exportar para no aumentar el bundle de la página
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const pdf = new jsPDF("p", "pt", "letter");
      const canvas = await html2canvas(reportsRef.current, { scale: 2 });
      const margin = 40;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      // Mantiene la proporción de la captura y la reparte en varias páginas si hace falta
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      const img = canvas.toDataURL("image/png");
      for (let offset = 0; offset < imgHeight; offset += pageHeight) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(img, "PNG", margin, margin - offset, pageWidth, imgHeight);
      }
      window.open(URL.createObjectURL(pdf.output("blob")), "_blank");
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  // Guarda el informe con sus datos para volver a abrirlo desde My Reports
  const handleSaveReport = async (name) => {
    try {
      await saveReport({
        name,
        type: typeReport,
        sheetName: reportSheetName || "",
        selectedOptions,
        snapshot: { headers, data, config, columnTypes },
      });
      setShowSaveModal(false);
      toast.success("Report saved. Find it in My Reports.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the report.");
    }
  };

  // Data for most-repeated report and charts
  const mostRepeatedIdx = selectedOptions.mostRepeated;
  // Informes generados antes de poder elegir la cantidad mostraban 5 valores
  const topLimit = config?.limit ?? 5;
  const { sorted, validRows } = useMemo(() => {
    if (typeReport !== "mostRepeated") return { sorted: [], validRows: 0 };
    const counts = {};
    let validRows = 0;
    data.forEach((row) => {
      const v = row[mostRepeatedIdx];
      if (v != null && v !== "") {
        counts[v] = (counts[v] || 0) + 1;
        validRows++;
      }
    });
    return { sorted: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, topLimit), validRows };
  }, [data, mostRepeatedIdx, typeReport, topLimit]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);

  const generateReportData = () => {
    if (!typeReport) return null;
    if (typeReport === "statistics") {
      return <StatisticsReport totalRows={filteredData.length} includedOptions={includedOptions} filteredData={filteredData} headers={headers} numericColumns={analysis.filter((c) => c.type === "numeric").map((c) => c.index)} decimalOf={(idx) => analysis[idx]?.decimal} />;
    }
    if (typeReport === "mostRepeated") {
      return sorted.length > 0
        ? <MostRepeatedReport column={columnName(mostRepeatedIdx)} mostRepeatedOptions={sorted} totalValidRows={validRows} />
        : <p className="text-gray-500 text-sm">No data to display.</p>;
    }
    if (typeReport === "group" && groupResult) {
      return (
        <GroupReport
          result={groupResult}
          config={config}
          headers={headers}
          includedOptions={includedOptions}
          rowCount={filteredData.length}
        />
      );
    }
  };

  const sharedDataset = {
    label: "Count",
    data: values,
    backgroundColor: values.map((_, i) => COLORS[i % COLORS.length].bg),
    borderColor: values.map((_, i) => COLORS[i % COLORS.length].border),
    borderWidth: 1,
  };

  const pieData  = { labels, datasets: [sharedDataset] };
  const barData  = { labels, datasets: [{ ...sharedDataset, borderRadius: 6 }] };

  // Trend line: agrupa por mes usando la primera columna de fecha detectada
  const dateCol = analysis.find((c) => c.type === "date");
  const trendData = useMemo(() => {
    if (!dateCol) return null;
    const byDate = {};
    filteredData.forEach((row) => {
      const d = parseDate(row[dateCol.index], dateCol.dateOrder);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byDate[key] = (byDate[key] || 0) + 1;
    });
    const months = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    if (months.length === 0) return null;
    return {
      labels: months.map(([k]) => k),
      datasets: [{
        label: `Records per month (${dateCol.name})`,
        data: months.map(([, v]) => v),
        borderColor: "rgba(59,130,246,1)",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgba(59,130,246,1)",
      }],
    };
  }, [dateCol, filteredData]);

  const baseOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "left" }, tooltip: { backgroundColor: "rgba(0,0,0,0.75)" } },
  };

  const hasData = data && data.length > 0 && typeReport;
  const showCharts = typeReport === "mostRepeated" && sorted.length > 0;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {showSaveModal && (
          <SaveReportModal
            defaultName={`${REPORT_TITLES[typeReport] || "Report"}${reportSheetName ? ` — ${reportSheetName}` : ""}`}
            onConfirm={handleSaveReport}
            onCancel={() => setShowSaveModal(false)}
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-gray-900 dark:text-white">Report Insights</h1>
                {reportSheetName && typeReport && (
                  <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md truncate max-w-[260px]">
                    <FontAwesomeIcon icon={faFileExcel} /> {reportSheetName}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {REPORT_TITLES[typeReport] || "No report selected"}
              </p>
            </div>
          </div>
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back
          </button>
        </div>

        {isRestoringReport && (
          <div className="flex justify-center py-12 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          </div>
        )}

        {/* Empty state */}
        {!hasData && !isRestoringReport && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <FontAwesomeIcon icon={faChartPie} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No report data available. Go back to the file reader and generate a report first.
            </p>
          </div>
        )}

        {hasData && (
          <>
            <div ref={reportsRef}>
            {/* Report content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4">
              {generateReportData()}
            </div>

            {/* Charts section */}
            {showCharts && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4">
                {/* Chart type tabs */}
                <div className="flex items-center gap-1 mb-5 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
                  {/* La línea temporal no depende de la columna analizada: se muestra en Statistics */}
                  {CHART_TABS.filter((t) => t.id !== "line").map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setChartType(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        chartType === id
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
                  {chartType === "pie"  && <Pie  data={pieData}   options={baseOpts} />}
                  {chartType === "bar"  && <Bar  data={barData}   options={{ ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: false } } }} />}
                </div>
              </div>
            )}

            {/* Trend line standalone (statistics report) */}
            {typeReport === "statistics" && trendData && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faChartLine} className="text-blue-500" />
                  Records over time · {dateCol?.name}
                </h2>
                <div className="h-56">
                  <Line data={trendData} options={{
                    ...baseOpts,
                    plugins: { ...baseOpts.plugins, legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }} />
                </div>
              </div>
            )}

            </div>

            <div className="flex flex-wrap justify-end gap-2">
              {isLoggedIn && (
                <button onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors">
                  <FontAwesomeIcon icon={faFloppyDisk} /> Save report
                </button>
              )}
              <button onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors">
                <FontAwesomeIcon icon={faFilePdf} /> Export as PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChartPage;