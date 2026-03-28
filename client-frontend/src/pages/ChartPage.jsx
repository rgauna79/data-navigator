import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import GroupByReport from "../components/reports/GroupByReport.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChartBar,
  faChartPie,
  faChartLine,
  faFloppyDisk,
  faSpinner,
  faCheck,
  faFilePdf,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
import jsPDF from "jspdf";

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
];

const CHART_TABS = [
  { id: "pie", label: "Pie", icon: faChartPie },
  { id: "bar", label: "Bar", icon: faChartBar },
  { id: "line", label: "Trend", icon: faChartLine },
];

const cleanNumericValue = (val) => {
  if (typeof val === "number") return val;
  if (!val || typeof val !== "string") return NaN;
  const clean = val.trim().replace(/[$\s,]/g, "");
  return clean.includes("/") ? NaN : parseFloat(clean);
};

function SaveReportModal({ onConfirm, onCancel, sheetName }) {
  const [name, setName] = useState(
    `${sheetName || "Sheet"} — ${new Date().toLocaleDateString()}`
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold mb-1">Save report</h3>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
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
    fileData,
    selectedOptions,
    selectedColumns,
    typeReport,
    saveReport,
    selectedSheet,
    fileName,
  } = useDataContext();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState(
    typeReport === "groupBy" ? "bar" : "pie"
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const headers = fileData?.[0] || [];
  const limit = selectedOptions?.limit || 10;
  const sysKeys = [
    "limit",
    "aggregation",
    "groupByCol",
    "calcCol",
    "mostRepeated",
  ];

  // 1. Statistics Filter
  const filteredData =
    typeReport === "statistics"
      ? data.filter((row) =>
          Object.entries(selectedOptions).every(([key, value]) => {
            if (sysKeys.includes(key) || !value || value === "") return true;
            if (typeof value === "object" && value.from && value.to) {
              const d = new Date(row[key]);
              return d >= new Date(value.from) && d <= new Date(value.to);
            }
            return String(row[key]) === String(value);
          })
        )
      : [];

  const includedOptions = Object.entries(selectedOptions)
    .filter(
      ([k, v]) =>
        !sysKeys.includes(k) && v !== "" && v !== null && v !== undefined
    )
    .map(([k, v]) => {
      const headerName = headers[k] || k;
      const valStr =
        typeof v === "object"
          ? `${new Date(v.from).toLocaleDateString()} → ${new Date(
              v.to
            ).toLocaleDateString()}`
          : v;
      return `${headerName}: ${valStr}`;
    });

  // 2. Most Repeated
  const counts =
    typeReport === "mostRepeated"
      ? data.reduce((acc, row) => {
          const v = row[selectedOptions.mostRepeated];
          if (v != null && v !== "") acc[v] = (acc[v] || 0) + 1;
          return acc;
        }, {})
      : {};
  const sortedMostRepeated = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // 3. Group By (Pivot)
  const groupedData = (() => {
    if (
      typeReport !== "groupBy" ||
      !selectedOptions.groupByCol ||
      !selectedOptions.calcCol
    )
      return [];
    const { groupByCol, calcCol, aggregation } = selectedOptions;
    const groups = {};
    data.forEach((row) => {
      const gVal = String(row[groupByCol] || "(Empty)").trim();
      const cVal = cleanNumericValue(row[calcCol]);
      if (!groups[gVal]) groups[gVal] = { sum: 0, count: 0 };
      if (!isNaN(cVal)) {
        groups[gVal].sum += cVal;
        groups[gVal].count += 1;
      }
    });
    return Object.entries(groups)
      .map(([label, stats]) => {
        let value = 0;
        if (aggregation === "sum") value = stats.sum;
        else if (aggregation === "avg")
          value = stats.count > 0 ? stats.sum / stats.count : 0;
        else if (aggregation === "count") value = stats.count;
        return { label, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  })();

  // --- GRAFICOS ---
  let chartLabels =
    typeReport === "mostRepeated"
      ? sortedMostRepeated.map(([k]) => k)
      : groupedData.map((d) => d.label);
  let chartValues =
    typeReport === "mostRepeated"
      ? sortedMostRepeated.map(([, v]) => v)
      : groupedData.map((d) => d.value);
  const getColors = (n, type) =>
    Array.from({ length: n }, (_, i) => COLORS[i % COLORS.length][type]);
  const sharedDataset = {
    label:
      typeReport === "groupBy"
        ? selectedOptions.aggregation?.toUpperCase()
        : "Count",
    data: chartValues,
    backgroundColor: getColors(chartLabels.length, "bg"),
    borderColor: getColors(chartLabels.length, "border"),
    borderWidth: 1,
  };
  const pieData = { labels: chartLabels, datasets: [sharedDataset] };
  const barData = {
    labels: chartLabels,
    datasets: [{ ...sharedDataset, borderRadius: 6 }],
  };

  // --- PDF EXPORT ---
  const handlePrint = () => {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = margin;
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Data Navigator Report", margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(120, 120, 120);
      const fileContext = fileName
        ? `${fileName.replace(".xlsx", "")} — ${selectedSheet}`
        : selectedSheet || "Data Sheet";
      const reportTitle =
        typeReport === "statistics"
          ? "Statistics"
          : typeReport === "groupBy"
          ? "Pivot Table Analysis"
          : "Most Repeated Values";
      pdf.text(
        `${reportTitle} · ${fileContext} · ${new Date().toLocaleDateString()}`,
        margin,
        y
      );
      y += 10;
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin, y, pageW - margin, y);
      y += 8;
      pdf.setTextColor(0, 0, 0);

      if (typeReport === "statistics") {
        if (includedOptions.length > 0) {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.text("Filters applied:", margin, y);
          y += 6;
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          includedOptions.forEach((f) => {
            pdf.text(`• ${f}`, margin + 4, y);
            y += 5;
          });
          y += 4;
        }
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Total matching rows: ${filteredData.length}`, margin, y);
        y += 10;
      }

      if (typeReport === "mostRepeated") {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `Column analyzed: ${
            headers[selectedOptions.mostRepeated] ||
            selectedOptions.mostRepeated
          }`,
          margin,
          y
        );
        y += 8;
        pdf.text(`Top ${sortedMostRepeated.length} values:`, margin, y);
        y += 6;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        sortedMostRepeated.forEach(([val, count], i) => {
          pdf.text(`${i + 1}. ${val || "(Empty)"} — ${count}`, margin + 4, y);
          y += 6;
        });
        y += 6;
      }

      if (typeReport === "groupBy") {
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `Grouped by: ${
            headers[selectedOptions.groupByCol]
          } | Operation: ${selectedOptions.aggregation.toUpperCase()} of ${
            headers[selectedOptions.calcCol]
          }`,
          margin,
          y
        );
        y += 8;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        groupedData.forEach((item, i) => {
          const fmtVal = Number.isInteger(item.value)
            ? item.value.toLocaleString()
            : item.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
          pdf.text(`${i + 1}. ${item.label} — ${fmtVal}`, margin + 4, y);
          y += 6;
        });
        y += 6;
      }

      if (chartRef.current) {
        const canvas = chartRef.current.canvas;
        const imgH = (canvas.height / canvas.width) * (pageW - margin * 2);
        if (y + imgH > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.addImage(
          canvas.toDataURL("image/png", 1.0),
          "PNG",
          margin,
          y,
          pageW - margin * 2,
          Math.min(imgH, 120)
        );
      }
      window.open(URL.createObjectURL(pdf.output("blob")), "_blank");
    } catch (err) {
      console.error("PDF error:", err);
    }
  };

  const handleSaveReport = async (name) => {
    try {
      await saveReport({
        name,
        type: typeReport,
        sheetName: selectedSheet || "",
        selectedOptions,
        selectedColumns,
        resultSummary: {},
      });
      setShowSaveModal(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setShowSaveModal(false);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const hasData = data && data.length > 0 && typeReport;
  const showCharts =
    (typeReport === "mostRepeated" && sortedMostRepeated.length > 0) ||
    (typeReport === "groupBy" && groupedData.length > 0);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-gray-900">
                  Report Insights
                </h1>
                {selectedSheet && (
                  <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md truncate max-w-[300px]">
                    <FontAwesomeIcon icon={faFileExcel} />{" "}
                    {fileName
                      ? `${fileName.replace(".xlsx", "")} — ${selectedSheet}`
                      : selectedSheet}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-500">
                {typeReport === "statistics"
                  ? "Statistics Overview"
                  : typeReport === "groupBy"
                  ? "Pivot Table Analysis"
                  : `Top ${limit} values`}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" /> Back
          </button>
        </div>

        {saveStatus === "success" && (
          <div className="bg-green-50 border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 font-medium">
            <FontAwesomeIcon icon={faCheck} /> Saved successfully.
          </div>
        )}

        {!hasData && (
          <div className="bg-white border-dashed border-gray-200 rounded-2xl py-16 text-center">
            <FontAwesomeIcon
              icon={faChartPie}
              className="text-4xl text-gray-300 mb-4"
            />
            <p className="text-gray-500 font-medium">No data.</p>
          </div>
        )}

        {hasData && (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
              {typeReport === "statistics" && (
                <StatisticsReport
                  totalRows={filteredData.length}
                  includedOptions={includedOptions}
                  filteredData={filteredData}
                  headers={headers}
                />
              )}
              {typeReport === "mostRepeated" && (
                <MostRepeatedReport
                  mostRepeatedOptions={sortedMostRepeated}
                  totalValidRows={Object.values(counts).reduce(
                    (a, b) => a + b,
                    0
                  )}
                />
              )}
              {typeReport === "groupBy" && (
                <GroupByReport
                  aggData={groupedData}
                  aggregation={selectedOptions.aggregation}
                  gName={headers[selectedOptions.groupByCol]}
                  cName={headers[selectedOptions.calcCol]}
                />
              )}
            </div>

            {showCharts && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 shadow-sm">
                <div className="flex items-center gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
                  {CHART_TABS.filter((t) => t.id !== "line").map(
                    ({ id, label, icon }) => (
                      <button
                        key={id}
                        onClick={() => setChartType(id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                          chartType === id
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={icon}
                          className={chartType === id ? "text-blue-500" : ""}
                        />{" "}
                        {label}
                      </button>
                    )
                  )}
                </div>
                <div className="h-72">
                  {chartType === "pie" && (
                    <Pie
                      ref={chartRef}
                      data={pieData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  )}
                  {chartType === "bar" && (
                    <Bar
                      ref={chartRef}
                      data={barData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm"
              >
                <FontAwesomeIcon icon={faFilePdf} /> Export PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChartPage;
