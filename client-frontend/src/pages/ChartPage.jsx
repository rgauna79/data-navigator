import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataContext } from "../context/DataContext.jsx";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Filler,
} from "chart.js";
import { analyzeColumns, parseDate } from "../utils/excelUtils.js";
import StatisticsReport from "../components/reports/StatisticsReport.jsx";
import MostRepeatedReport from "../components/reports/MostRepeatedReport.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf, faArrowLeft, faChartBar, faChartPie, faChartLine, faSpinner,
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
];

const CHART_TABS = [
  { id: "pie",  label: "Pie",  icon: faChartPie  },
  { id: "bar",  label: "Bar",  icon: faChartBar  },
  { id: "line", label: "Trend",icon: faChartLine },
];

const fmtDate = (d) => new Date(d).toLocaleDateString("en-US");

// Fin del día, para que el rango de fechas incluya el día "hasta"
const endOfDay = (d) => {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
};

// Compara una fila con el filtro de una columna (valor exacto o rango de fechas)
const matchRow = (row, idx, value) => {
  if (value === "" || value == null) return true;
  if (typeof value === "object" && "from" in value) {
    const d = parseDate(row[idx]);
    if (!d) return false;
    return d >= new Date(value.from) && d <= endOfDay(value.to);
  }
  return String(row[idx]) === String(value);
};

function ChartPage() {
  const { data, headers, selectedOptions, typeReport, isRestoringReport } = useDataContext();
  const reportsRef = useRef();
  const navigate = useNavigate();
  const [chartType, setChartType] = useState("pie");

  const columnName = (idx) => headers?.[idx] ?? `Column ${Number(idx) + 1}`;

  const formatOptionValue = (value) => {
    if (value && typeof value === "object" && "from" in value) {
      return `${fmtDate(value.from)} → ${fmtDate(value.to)}`;
    }
    return value;
  };

  // Análisis de columnas de los datos del informe (no del archivo abierto en el lector)
  const analysis = useMemo(
    () => (headers?.length ? analyzeColumns([headers, ...data]) : []),
    [headers, data]
  );

  const filteredData = useMemo(() => {
    if (typeReport !== "statistics") return data;
    return data.filter((row) =>
      Object.entries(selectedOptions).every(([idx, value]) => matchRow(row, Number(idx), value))
    );
  }, [data, selectedOptions, typeReport]);

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

  // Data for most-repeated report and charts
  const mostRepeatedIdx = selectedOptions.mostRepeated;
  const sorted = useMemo(() => {
    if (typeReport !== "mostRepeated") return [];
    const counts = {};
    data.forEach((row) => {
      const v = row[mostRepeatedIdx];
      if (v != null && v !== "") counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [data, mostRepeatedIdx, typeReport]);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);

  const generateReportData = () => {
    if (!typeReport) return null;
    if (typeReport === "statistics") {
      const includedOptions = Object.entries(selectedOptions)
        .filter(([, v]) => v !== "" && v != null)
        .map(([idx, v]) => `${columnName(idx)}: ${formatOptionValue(v)}`);
      return <StatisticsReport totalRows={filteredData.length} includedOptions={includedOptions} filteredData={filteredData} headers={headers} />;
    }
    if (typeReport === "mostRepeated") {
      return sorted.length > 0
        ? <MostRepeatedReport column={columnName(mostRepeatedIdx)} mostRepeatedOptions={sorted} />
        : <p className="text-gray-500 text-sm">No data to display.</p>;
    }
  };

  const sharedDataset = {
    label: "Count",
    data: values,
    backgroundColor: COLORS.map((c) => c.bg),
    borderColor: COLORS.map((c) => c.border),
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
      const d = parseDate(row[dateCol.index]);
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

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {typeReport === "statistics" ? "Statistics report" : typeReport === "mostRepeated" ? "Most repeated values" : "No report selected"}
              </p>
            </div>
          </div>
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
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
                  {CHART_TABS.filter(t => t.id !== "line" || trendData).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setChartType(id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        chartType === id
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
                  {chartType === "pie"  && <Pie  data={pieData}   options={baseOpts} />}
                  {chartType === "bar"  && <Bar  data={barData}   options={{ ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: false } } }} />}
                  {chartType === "line" && trendData && (
                    <Line data={trendData} options={{
                      ...baseOpts,
                      plugins: { ...baseOpts.plugins, legend: { display: false } },
                      scales: { y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } } },
                    }} />
                  )}
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
                    scales: { y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } } },
                  }} />
                </div>
              </div>
            )}

            </div>

            <div className="flex justify-end">
              <button onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
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