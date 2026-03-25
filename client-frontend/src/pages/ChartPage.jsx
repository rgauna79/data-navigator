import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useDataContext } from "../context/DataContext.jsx";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Filler,
} from "chart.js";
import StatisticsReport from "../components/reports/StatisticsReport.jsx";
import MostRepeatedReport from "../components/reports/MostRepeatedReport.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilePdf, faArrowLeft, faChartBar, faChartPie, faChartLine,
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

function ChartPage() {
  const { data, selectedOptions, typeReport, columnAnalysis } = useDataContext();
  const reportsRef = useRef();
  const navigate = useNavigate();
  const [chartType, setChartType] = useState("pie");

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

  const generateReportData = () => {
    if (!typeReport) return null;
    if (typeReport === "statistics") {
      const filteredData = data.filter((row) =>
        Object.entries(selectedOptions).every(([, value]) => row.includes(value))
      );
      const includedOptions = Object.entries(selectedOptions)
        .filter(([, v]) => v !== "")
        .map(([k, v]) => `${k}: ${v}`);
      return <StatisticsReport totalRows={filteredData.length} includedOptions={includedOptions} filteredData={filteredData} />;
    }
    if (typeReport === "mostRepeated") {
      const counts = {};
      data.forEach((row) => {
        const v = row[selectedOptions.mostRepeated];
        if (v != null && v !== "") counts[v] = (counts[v] || 0) + 1;
      });
      const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      return top.length > 0
        ? <MostRepeatedReport mostRepeatedOptions={top} />
        : <p className="text-gray-500 text-sm">No data to display.</p>;
    }
  };

  // Data for most-repeated charts
  const counts = data.reduce((acc, row) => {
    const v = row[selectedOptions.mostRepeated];
    if (v != null && v !== "") acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const labels = sorted.map(([k]) => k);
  const values = sorted.map(([, v]) => v);

  const sharedDataset = {
    label: "Count",
    data: values,
    backgroundColor: COLORS.map((c) => c.bg),
    borderColor: COLORS.map((c) => c.border),
    borderWidth: 1,
  };

  const pieData  = { labels, datasets: [sharedDataset] };
  const barData  = { labels, datasets: [{ ...sharedDataset, borderRadius: 6 }] };

  // Trend line: group data by date column if available
  const dateCol = columnAnalysis?.find((c) => c.type === "date");
  const trendData = (() => {
    if (!dateCol) return null;
    const byDate = {};
    data.forEach((row) => {
      const raw = row[Object.keys(row).find((k) =>
        (row[k] && !isNaN(new Date(row[k]).getTime()) && typeof row[k] === "string")
      )];
      if (!raw) return;
      const d = new Date(raw);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byDate[key] = (byDate[key] || 0) + 1;
    });
    const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: sorted.map(([k]) => k),
      datasets: [{
        label: "Records per month",
        data: sorted.map(([, v]) => v),
        borderColor: "rgba(59,130,246,1)",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgba(59,130,246,1)",
      }],
    };
  })();

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

        {/* Empty state */}
        {!hasData && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <FontAwesomeIcon icon={faChartPie} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No report data available. Go back to the file reader and generate a report first.
            </p>
          </div>
        )}

        {hasData && (
          <>
            {/* Report content */}
            <div ref={reportsRef} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-4">
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
                  Records over time
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