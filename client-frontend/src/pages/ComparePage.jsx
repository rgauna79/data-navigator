import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDataContext } from "../context/DataContext";
import { analyzeColumns } from "../hooks/useExcelData.js";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCodeCompare, faHashtag, faTag, faCalendar,
  faArrowsLeftRight, faSpinner, faFileExcel, faDatabase,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const buildSummary = (data) => {
  if (!data || data.length < 2) return [];
  return analyzeColumns(data);
};

function CompareCard({ colA, colB, nameA, nameB }) {
  const col = colA || colB;
  if (!col) return null;
  const type = col.type;

  const fmt = (n) => {
    if (n === undefined || n === null || isNaN(n)) return "—";
    return typeof n === "number" ? parseFloat(n.toFixed(2)).toLocaleString() : n;
  };
  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const headerColor =
    type === "numeric" ? "bg-blue-50 dark:bg-blue-900/20" :
    type === "date"    ? "bg-purple-50 dark:bg-purple-900/20" :
                         "bg-amber-50 dark:bg-amber-900/20";
  const iconColor =
    type === "numeric" ? "text-blue-500" :
    type === "date"    ? "text-purple-500" : "text-amber-500";

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <div className={`px-3 py-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 ${headerColor}`}>
        <FontAwesomeIcon
          icon={type === "numeric" ? faHashtag : type === "date" ? faCalendar : faTag}
          className={`text-xs ${iconColor}`}
        />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{col.name}</span>
      </div>

      {/* Column sub-headers */}
      <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-700/30">
        <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 px-3 py-1 truncate">{nameA}</p>
        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-3 py-1 truncate">{nameB}</p>
      </div>

      {type === "numeric" && (
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
          {[colA, colB].map((c, i) => (
            <div key={i} className="p-3 space-y-1.5">
              {[
                { label: "Sum",   val: fmt(c?.sum) },
                { label: "Avg",   val: fmt(c?.avg) },
                { label: "Min",   val: fmt(c?.min) },
                { label: "Max",   val: fmt(c?.max) },
                { label: "Count", val: c?.count ?? "—" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-gray-500">{label}</span>
                  <span className={`font-medium ${c ? "text-gray-800 dark:text-gray-200" : "text-gray-300"}`}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {type === "date" && (
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
          {[colA, colB].map((c, i) => (
            <div key={i} className="p-3 space-y-1.5">
              {[
                { label: "From",  val: fmtDate(c?.min) },
                { label: "To",    val: fmtDate(c?.max) },
                { label: "Count", val: c?.count ?? "—" },
              ].map(({ label, val }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-400 dark:text-gray-500">{label}</span>
                  <span className={`font-medium ${c ? "text-gray-800 dark:text-gray-200" : "text-gray-300"}`}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {type === "categorical" && (
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
          {[colA, colB].map((c, i) => (
            <div key={i} className="p-3">
              <div className="space-y-1">
                {c ? (c.topValues || []).slice(0, 3).map(([val, count]) => (
                  <div key={val} className="flex justify-between text-xs">
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[60%]">{val || "—"}</span>
                    <span className="text-gray-500 font-medium">{count}</span>
                  </div>
                )) : <span className="text-xs text-gray-300 dark:text-gray-600">No data</span>}
              </div>
              {c && <p className="text-[10px] text-gray-400 mt-2">{c.unique} unique</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareChart({ summaryA, summaryB, labelA, labelB }) {
  const [metric, setMetric] = useState("avg");

  const numericCols = useMemo(() => {
    const colsA = summaryA.filter((c) => c.type === "numeric").map((c) => c.name);
    const colsB = summaryB.filter((c) => c.type === "numeric").map((c) => c.name);
    return [...new Set([...colsA, ...colsB])].slice(0, 8);
  }, [summaryA, summaryB]);

  if (numericCols.length === 0) return null;

  const getVal = (summary, colName, m) => {
    const col = summary.find((c) => c.name === colName);
    return col ? parseFloat((col[m] || 0).toFixed(2)) : 0;
  };

  const chartData = {
    labels: numericCols,
    datasets: [
      {
        label: labelA,
        data: numericCols.map((col) => getVal(summaryA, col, metric)),
        backgroundColor: "rgba(59,130,246,0.7)",
        borderColor: "rgba(59,130,246,1)",
        borderWidth: 1, borderRadius: 4,
      },
      {
        label: labelB,
        data: numericCols.map((col) => getVal(summaryB, col, metric)),
        backgroundColor: "rgba(16,185,129,0.7)",
        borderColor: "rgba(16,185,129,1)",
        borderWidth: 1, borderRadius: 4,
      },
    ],
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Numeric comparison</h2>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value)}
          className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {["avg","sum","min","max"].map((m) => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="h-64">
        <Bar data={chartData} options={{
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: "top", labels: { font: { size: 12 }, padding: 12 } },
            tooltip: { backgroundColor: "rgba(0,0,0,0.75)" },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
            x: { grid: { display: false }, ticks: { maxRotation: 30 } },
          },
        }} />
      </div>
    </div>
  );
}

// Selector de una sheet — carga de archivo o DB
function SheetPicker({ label, color, accentText, workbook, savedSheets, isLoadingDB, value, onChange }) {
  const [source, setSource] = useState("loaded");

  const hasLoadedFile = workbook && workbook.SheetNames.length > 0;
  const hasSavedSheets = savedSheets.length > 0;

  const options = source === "loaded"
    ? (workbook?.SheetNames || [])
    : savedSheets.map((s) => s.sheetName);

  const handleSourceChange = (s) => {
    setSource(s);
    onChange(null, s); // reset selection cuando cambia fuente
  };

  const handleSelect = (e) => {
    const name = e.target.value;
    onChange(name || null, source);
  };

  return (
    <div className={`flex-1 bg-white dark:bg-gray-800 border-2 ${color} rounded-2xl p-4 min-w-0`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${accentText}`}>{label}</p>

      {/* Source toggle */}
      <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
        <button
          onClick={() => handleSourceChange("loaded")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-medium transition-colors ${
            source === "loaded"
              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <FontAwesomeIcon icon={faFileExcel} className="text-green-500" />
          Loaded file
        </button>
        <button
          onClick={() => handleSourceChange("saved")}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-medium transition-colors ${
            source === "saved"
              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <FontAwesomeIcon icon={faDatabase} className="text-purple-500" />
          Saved DB
          {isLoadingDB && <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />}
        </button>
      </div>

      {/* Estado vacío para cada fuente */}
      {source === "loaded" && !hasLoadedFile && (
        <div className="text-center py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">No file loaded.</p>
          <Link to="/filereader" className="text-xs text-blue-500 hover:text-blue-400 underline">
            Go to File Reader →
          </Link>
        </div>
      )}

      {source === "saved" && !isLoadingDB && !hasSavedSheets && (
        <div className="text-center py-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">No saved sheets found.</p>
          <Link to="/filereader" className="text-xs text-blue-500 hover:text-blue-400 underline">
            Save a sheet first →
          </Link>
        </div>
      )}

      {/* Dropdown */}
      {((source === "loaded" && hasLoadedFile) || (source === "saved" && hasSavedSheets)) && (
        <select
          value={value?.name || ""}
          onChange={handleSelect}
          className="w-full text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a sheet...</option>
          {options.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function ComparePage() {
  const { workbook, dataSaved, readAllData, isLoadingData } = useDataContext();
  const [sheetA, setSheetA] = useState(null);
  const [sheetB, setSheetB] = useState(null);

  // ✅ Cargar sheets de la DB al entrar a la página
  useEffect(() => { readAllData(); }, []);

  const savedSheets = Array.isArray(dataSaved)
    ? dataSaved
    : Array.isArray(dataSaved?.data) ? dataSaved.data : [];

  const formatJson = (json) =>
    json.map((row) =>
      row.map((cell) => typeof cell === "string" ? cell.trim().toUpperCase() : cell)
    );

  const loadSheet = (name, source, setter) => {
    if (!name) { setter(null); return; }
    if (source === "loaded" && workbook) {
      const sheet = workbook.Sheets[name];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      setter({ name, data: formatJson(json) });
    } else if (source === "saved") {
      const found = savedSheets.find((s) => s.sheetName === name);
      if (found) setter({ name, data: found.fileData });
    }
  };

  const summaryA = useMemo(() => sheetA ? buildSummary(sheetA.data) : [], [sheetA]);
  const summaryB = useMemo(() => sheetB ? buildSummary(sheetB.data) : [], [sheetB]);

  const allColNames = useMemo(() => {
    const names = new Set([...summaryA.map((c) => c.name), ...summaryB.map((c) => c.name)]);
    return [...names];
  }, [summaryA, summaryB]);

  const commonCount = useMemo(() => {
    const namesA = new Set(summaryA.map((c) => c.name));
    return summaryB.filter((c) => namesA.has(c.name)).length;
  }, [summaryA, summaryB]);

  const canCompare = sheetA && sheetB;

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-5xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FontAwesomeIcon icon={faCodeCompare} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Compare Sheets</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Side-by-side analysis from loaded file or saved database
            </p>
          </div>
        </div>

        {/* Sheet selectors */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch">
          <SheetPicker
            label="Sheet A"
            color="border-blue-300 dark:border-blue-600"
            accentText="text-blue-600 dark:text-blue-400"
            workbook={workbook}
            savedSheets={savedSheets}
            isLoadingDB={isLoadingData}
            value={sheetA}
            onChange={(name, source) => loadSheet(name, source, setSheetA)}
          />
          <div className="flex items-center justify-center text-gray-300 dark:text-gray-600 flex-shrink-0">
            <FontAwesomeIcon icon={faArrowsLeftRight} className="text-xl" />
          </div>
          <SheetPicker
            label="Sheet B"
            color="border-emerald-300 dark:border-emerald-600"
            accentText="text-emerald-600 dark:text-emerald-400"
            workbook={workbook}
            savedSheets={savedSheets}
            isLoadingDB={isLoadingData}
            value={sheetB}
            onChange={(name, source) => loadSheet(name, source, setSheetB)}
          />
        </div>

        {/* Empty state */}
        {!canCompare && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
            <FontAwesomeIcon icon={faCodeCompare} className="text-4xl text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Select a sheet in both panels above to start comparing.
            </p>
          </div>
        )}

        {canCompare && (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap gap-3 mb-5 items-center">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-xl px-4 py-2 text-sm">
                <span className="font-semibold">{sheetA.name}</span>
                <span className="text-xs opacity-75">
                  {((sheetA.data?.length || 1) - 1).toLocaleString()} rows · {summaryA.length} cols
                </span>
              </div>
              <FontAwesomeIcon icon={faArrowsLeftRight} className="text-gray-400 text-sm" />
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-xl px-4 py-2 text-sm">
                <span className="font-semibold">{sheetB.name}</span>
                <span className="text-xs opacity-75">
                  {((sheetB.data?.length || 1) - 1).toLocaleString()} rows · {summaryB.length} cols
                </span>
              </div>
              {commonCount > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {commonCount} columns in common
                </span>
              )}
            </div>

            {/* Bar chart */}
            <CompareChart
              summaryA={summaryA}
              summaryB={summaryB}
              labelA={sheetA.name}
              labelB={sheetB.name}
            />

            {/* Column cards */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Column by column
                <span className="text-xs font-normal text-gray-400 ml-2">
                  left: <span className="text-blue-500">{sheetA.name}</span>
                  {" · "}right: <span className="text-emerald-500">{sheetB.name}</span>
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {allColNames.map((colName) => {
                  const cA = summaryA.find((c) => c.name === colName);
                  const cB = summaryB.find((c) => c.name === colName);
                  return (
                    <CompareCard
                      key={colName}
                      colA={cA} colB={cB}
                      nameA={sheetA.name} nameB={sheetB.name}
                    />
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ComparePage;