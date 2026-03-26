import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import StatisticsReport from "../components/reports/StatisticsReport.jsx";
import MostRepeatedReport from "../components/reports/MostRepeatedReport.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf,
  faArrowLeft,
  faChartBar,
  faChartPie,
  faChartLine,
  faFloppyDisk,
  faSpinner,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

const COLORS = [
  { bg: "rgba(59,130,246,0.7)", border: "rgba(59,130,246,1)" },
  { bg: "rgba(16,185,129,0.7)", border: "rgba(16,185,129,1)" },
  { bg: "rgba(245,158,11,0.7)", border: "rgba(245,158,11,1)" },
  { bg: "rgba(239,68,68,0.7)", border: "rgba(239,68,68,1)" },
  { bg: "rgba(139,92,246,0.7)", border: "rgba(139,92,246,1)" },
];

const CHART_TABS = [
  { id: "pie", label: "Pie", icon: faChartPie },
  { id: "bar", label: "Bar", icon: faChartBar },
  { id: "line", label: "Trend", icon: faChartLine },
];

// Modal para poner nombre al reporte antes de guardar
function SaveReportModal({ onConfirm, onCancel, sheetName }) {
  const [name, setName] = useState(
    `${sheetName} — ${new Date().toLocaleDateString()}`
  );
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onConfirm(name.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Save report
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Give this report a name to find it later.
        </p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Report name..."
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChartPage() {
  const {
    data,
    selectedOptions,
    selectedColumns,
    typeReport,
    columnAnalysis,
    saveReport,
  } = useDataContext();
  const { isLoggedIn } = useAuth();
  const reportsRef = useRef();
  const navigate = useNavigate();
  const [chartType, setChartType] = useState("pie");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  const selectedSheet = useDataContext().selectedSheet || "";

  const handlePrint = async () => {
    try {
      const pdf = new jsPDF("p", "pt", "letter");
      if (reportsRef.current) {
        const canvas = await html2canvas(reportsRef.current);
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 40, 40, 520, 320);
      }
      window.open(URL.createObjectURL(await pdf.output("blob")), "_blank");
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  const handleSaveReport = async (name) => {
    try {
      await saveReport({
        name,
        type: typeReport,
        sheetName: selectedSheet,
        selectedOptions,
        selectedColumns,
        resultSummary: {}, // snapshot opcional
      });
      setShowSaveModal(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setShowSaveModal(false);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const generateReportData = () => {
    if (!typeReport) return null;
    if (typeReport === "statistics") {
      const filteredData = data.filter((row) =>
        Object.entries(selectedOptions).every(([, value]) =>
          row.includes(value)
        )
      );
      const includedOptions = Object.entries(selectedOptions)
        .filter(([, v]) => v !== "")
        .map(([k, v]) => `${k}: ${v}`);
      return (
        <StatisticsReport
          totalRows={filteredData.length}
          includedOptions={includedOptions}
          filteredData={filteredData}
        />
      );
    }
    if (typeReport === "mostRepeated") {
      const counts = {};
      data.forEach((row) => {
        const v = row[selectedOptions.mostRepeated];
        if (v != null && v !== "") counts[v] = (counts[v] || 0) + 1;
      });
      const top = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      return top.length > 0 ? (
        <MostRepeatedReport mostRepeatedOptions={top} />
      ) : (
        <p className="text-gray-500 text-sm">No data.</p>
      );
    }
  };

  const counts = data.reduce((acc, row) => {
    const v = row[selectedOptions.mostRepeated];
    if (v != null && v !== "") acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);
  const sharedDataset = {
    label: "Count",
    data: values,
    backgroundColor: COLORS.map((c) => c.bg),
    borderColor: COLORS.map((c) => c.border),
    borderWidth: 1,
  };
  const pieData = { labels, datasets: [sharedDataset] };
  const barData = { labels, datasets: [{ ...sharedDataset, borderRadius: 6 }] };

  const dateCol = columnAnalysis?.find((c) => c.type === "date");
  const trendData = (() => {
    if (!dateCol) return null;
    const byDate = {};
    data.forEach((row) => {
      const raw = Object.values(row).find(
        (v) =>
          typeof v === "string" &&
          !isNaN(new Date(v).getTime()) &&
          v.trim() !== ""
      );
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      byDate[key] = (byDate[key] || 0) + 1;
    });
    const s = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: s.map(([k]) => k),
      datasets: [
        {
          label: "Records / month",
          data: s.map(([, v]) => v),
          borderColor: "rgba(59,130,246,1)",
          backgroundColor: "rgba(59,130,246,0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "rgba(59,130,246,1)",
        },
      ],
    };
  })();

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "left" },
      tooltip: { backgroundColor: "rgba(0,0,0,0.75)" },
    },
  };
  const hasData = data && data.length > 0 && typeReport;
  const showCharts = typeReport === "mostRepeated" && sorted.length > 0;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      {showSaveModal && (
        <SaveReportModal
          sheetName={selectedSheet}
          onConfirm={handleSaveReport}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Reports
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {typeReport === "statistics"
                  ? "Statistics"
                  : typeReport === "mostRepeated"
                  ? "Most repeated values"
                  : "No report selected"}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back
          </button>
        </div>

        {saveStatus === "success" && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm px-4 py-2 rounded-xl mb-4">
            <FontAwesomeIcon icon={faCheck} /> Report saved successfully.
          </div>
        )}
        {saveStatus === "error" && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-2 rounded-xl mb-4">
            Error saving report. Please try again.
          </div>
        )}

        {!hasData && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <FontAwesomeIcon
              icon={faChartPie}
              className="text-4xl text-gray-300 dark:text-gray-600 mb-4"
            />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No report data. Go back to the file reader and generate a report
              first.
            </p>
          </div>
        )}

        {hasData && (
          <>
            <div
              ref={reportsRef}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4"
            >
              {generateReportData()}
            </div>

            {showCharts && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4">
                <div className="flex items-center gap-1 mb-5 bg-gray-100 dark:bg-gray-700 rounded-xl p-1 w-fit">
                  {CHART_TABS.filter((t) => t.id !== "line" || trendData).map(
                    ({ id, label, icon }) => (
                      <button
                        key={id}
                        onClick={() => setChartType(id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          chartType === id
                            ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                      >
                        <FontAwesomeIcon icon={icon} className="text-xs" />{" "}
                        {label}
                      </button>
                    )
                  )}
                </div>
                <div className="h-72">
                  {chartType === "pie" && (
                    <Pie data={pieData} options={baseOpts} />
                  )}
                  {chartType === "bar" && (
                    <Bar
                      data={barData}
                      options={{
                        ...baseOpts,
                        plugins: {
                          ...baseOpts.plugins,
                          legend: { display: false },
                        },
                      }}
                    />
                  )}
                  {chartType === "line" && trendData && (
                    <Line
                      data={trendData}
                      options={{
                        ...baseOpts,
                        plugins: {
                          ...baseOpts.plugins,
                          legend: { display: false },
                        },
                        scales: { y: { beginAtZero: true } },
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {typeReport === "statistics" && trendData && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={faChartLine}
                    className="text-blue-500"
                  />{" "}
                  Records over time
                </h2>
                <div className="h-56">
                  <Line
                    data={trendData}
                    options={{
                      ...baseOpts,
                      plugins: {
                        ...baseOpts.plugins,
                        legend: { display: false },
                      },
                      scales: { y: { beginAtZero: true } },
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              {isLoggedIn && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} /> Save Report
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
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
