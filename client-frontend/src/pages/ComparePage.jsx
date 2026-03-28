import React, { useState, useMemo, useEffect } from "react";
import { useDataContext } from "../context/DataContext";
import { analyzeColumns } from "../hooks/useExcelData.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCodeCompare,
  faHashtag,
  faTag,
  faCalendar,
  faFileExcel,
  faDatabase,
  faFilter,
  faSearch,
  faTriangleExclamation,
  faArrowTrendUp,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

// --- COMPONENT: COMPARISON CARD ---
function CompareCard({ colA, colB, nameA, nameB }) {
  const typeMismatch = colA && colB && colA.type !== colB.type;
  const col = colA || colB;
  if (!col) return null;
  const type = col.type;

  const fmt = (n) =>
    n !== undefined && n !== null && !isNaN(n) ? n.toLocaleString() : "—";
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

  // Función para calcular delta porcentual
  const getDelta = (valA, valB) => {
    if (valA === undefined || valB === undefined || valA === 0) return null;
    const diff = ((valB - valA) / valA) * 100;
    return {
      val: diff.toFixed(1),
      isPos: diff > 0,
      isNeg: diff < 0,
    };
  };

  const theme = {
    numeric: { text: "text-blue-500", bg: "bg-blue-50", icon: faHashtag },
    date: { text: "text-purple-500", bg: "bg-purple-50", icon: faCalendar },
    categorical: { text: "text-amber-500", bg: "bg-amber-50", icon: faTag },
  };

  const currentTheme = theme[type] || theme.categorical;

  return (
    <div
      className={`bg-white dark:bg-gray-800 border rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow ${
        typeMismatch ? "border-red-300" : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div
            className={`w-7 h-7 ${currentTheme.bg} rounded-lg flex items-center justify-center ${currentTheme.text}`}
          >
            <FontAwesomeIcon icon={currentTheme.icon} className="text-xs" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white truncate uppercase tracking-tight">
            {col.name || "Unnamed Column"}
          </span>
        </div>
        {typeMismatch && (
          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-bold uppercase">
            Type Mismatch
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700">
          <span className="text-[10px] font-black text-blue-500 truncate block uppercase">
            {nameA || "Source A"}
          </span>
        </div>
        <div className="px-4 py-1.5 text-right">
          <span className="text-[10px] font-black text-emerald-500 truncate block uppercase">
            {nameB || "Source B"}
          </span>
        </div>
      </div>

      <div className="p-4 flex-1">
        {type === "numeric" && (
          <div className="space-y-4">
            {[
              { l: "Sum Total", f: "sum" },
              { l: "Average", f: "avg" },
              { l: "Median", f: "median" },
            ].map((m) => {
              const delta = getDelta(colA?.[m.f], colB?.[m.f]);
              return (
                <div key={m.l} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      {m.l}
                    </span>
                    {delta && (
                      <span
                        className={`text-[10px] font-bold ${
                          delta.isPos
                            ? "text-emerald-500"
                            : delta.isNeg
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={delta.isPos ? faArrowTrendUp : faArrowTrendDown}
                          className="mr-1"
                        />
                        {delta.val}%
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      {fmt(colA?.[m.f])}
                    </span>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 text-right">
                      {fmt(colB?.[m.f])}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {type === "date" && (
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 h-full">
            {[colA, colB].map((c, i) => (
              <div
                key={i}
                className={`px-2 space-y-3 ${i === 1 ? "text-right" : ""}`}
              >
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                  Time Range
                </span>
                {c?.min ? (
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400">From:</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {fmtDate(c.min)}
                    </p>
                    <p className="text-[10px] text-gray-400">To:</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {fmtDate(c.max)}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-gray-300 italic">No data</span>
                )}
              </div>
            ))}
          </div>
        )}

        {type === "categorical" && (
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 h-full gap-4">
            {[colA, colB].map((c, i) => (
              <div key={i} className="flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">
                    Top 5 Values
                  </span>
                  {/* ✅ Solucionado el issue del Top 2 (slice(0, 5)) */}
                  {c?.topValues?.slice(0, 5).map(([v, count]) => (
                    <div key={v}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="truncate text-gray-600 dark:text-gray-400 font-medium">
                          {v || "(EMPTY)"}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {count}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{
                            width: `${Math.min(100, (count / c.count) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-2 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center text-[10px]">
                  <span className="text-gray-400 font-bold uppercase">
                    Unique
                  </span>
                  <span className="font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                    {c?.unique || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
function ComparePage() {
  const { workbook, dataSaved, readAllData } = useDataContext();
  const [sheetA, setSheetA] = useState(null);
  const [sheetB, setSheetB] = useState(null);
  const [onlyDiffs, setOnlyDiffs] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    readAllData();
  }, []);

  const savedSheets = useMemo(
    () => (Array.isArray(dataSaved) ? dataSaved : dataSaved?.data || []),
    [dataSaved]
  );

  const loadSheet = (name, source, setter) => {
    if (!name) {
      setter(null);
      return;
    }
    if (source === "loaded" && workbook) {
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
        header: 1,
        raw: false,
      });
      setter({ name, data: json });
    } else {
      const found = savedSheets.find((s) => s.sheetName === name);
      if (found) setter({ name, data: found.fileData });
    }
  };

  const summaryA = useMemo(
    () => (sheetA ? analyzeColumns(sheetA.data) : []),
    [sheetA]
  );
  const summaryB = useMemo(
    () => (sheetB ? analyzeColumns(sheetB.data) : []),
    [sheetB]
  );

  const displayCols = useMemo(() => {
    const names = [
      ...new Set([
        ...summaryA.map((c) => c.name),
        ...summaryB.map((c) => c.name),
      ]),
    ];
    return names.filter((name) => {
      const colName = name || "";
      const matchesSearch = colName
        .toLowerCase()
        .includes((search || "").toLowerCase());

      if (!matchesSearch) return false;
      if (!onlyDiffs) return true;

      const cA = summaryA.find((c) => c.name === name);
      const cB = summaryB.find((c) => c.name === name);

      if (!cA || !cB || cA.type !== cB.type) return true;
      if (cA.type === "numeric") {
        const diff = Math.abs((cA.sum || 0) - (cB.sum || 0));
        return diff > cA.sum * 0.01;
      }
      return cA.unique !== cB.unique;
    });
  }, [summaryA, summaryB, onlyDiffs, search]);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8 max-w-4xl mx-auto">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FontAwesomeIcon icon={faCodeCompare} className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Data Auditor
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-balance">
              Compare and detect discrepancies between different data sources
              instantly.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SheetPicker
            label="Primary Source (A)"
            workbook={workbook}
            savedSheets={savedSheets}
            value={sheetA}
            onChange={(n, s) => loadSheet(n, s, setSheetA)}
          />
          <SheetPicker
            label="Comparison Target (B)"
            workbook={workbook}
            savedSheets={savedSheets}
            value={sheetB}
            onChange={(n, s) => loadSheet(n, s, setSheetB)}
          />
        </div>

        {sheetA && sheetB && (
          <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter specific columns..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setOnlyDiffs(!onlyDiffs)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
                onlyDiffs
                  ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FontAwesomeIcon icon={faFilter} />
              {onlyDiffs ? "Showing Differences" : "Show All Columns"}
            </button>
          </div>
        )}

        {sheetA && sheetB ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Analysis Matrix
              </span>
              <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
              <span className="px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase shadow-sm">
                {displayCols.length} Columns
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {displayCols.map((colName) => (
                <CompareCard
                  key={colName}
                  nameA={sheetA.name}
                  nameB={sheetB.name}
                  colA={summaryA.find((c) => c.name === colName)}
                  colB={summaryB.find((c) => c.name === colName)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-[2.5rem] py-24 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <FontAwesomeIcon icon={faCodeCompare} className="text-3xl" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Ready to audit?
            </h2>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Select two spreadsheets from your local files or database to begin
              the comparative analysis.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SheetPicker({ label, workbook, savedSheets, value, onChange }) {
  const [source, setSource] = useState("loaded");
  const options =
    source === "loaded"
      ? workbook?.SheetNames || []
      : savedSheets.map((s) => s.sheetName);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-5 block">
        {label}
      </label>
      <div className="flex gap-2 mb-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-1.5 border border-gray-100 dark:border-gray-800">
        {[
          {
            id: "loaded",
            icon: faFileExcel,
            label: "Excel",
            color: "text-green-500",
            bg: "bg-green-50",
          },
          {
            id: "saved",
            icon: faDatabase,
            label: "Database",
            color: "text-purple-500",
            bg: "bg-purple-50",
          },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSource(s.id);
              onChange(null, s.id);
            }}
            className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase py-2.5 rounded-xl transition-all ${
              source === s.id
                ? "bg-white dark:bg-gray-800 text-gray-900 shadow-md border border-gray-100 dark:border-gray-700"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <FontAwesomeIcon icon={s.icon} className={`${s.color}`} />
            {s.label}
          </button>
        ))}
      </div>
      <select
        value={value?.name || ""}
        onChange={(e) => onChange(e.target.value, source)}
        className="w-full text-sm font-bold bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
      >
        <option value="">Select sheet...</option>
        {options.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ComparePage;
