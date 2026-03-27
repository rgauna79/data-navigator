import React, { useState, useMemo, useEffect } from "react";
import { useDataContext } from "../context/DataContext";
import { analyzeColumns } from "../hooks/useExcelData.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCodeCompare, faHashtag, faTag, faCalendar,
  faFileExcel, faDatabase, faFilter, faSearch, faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";

// --- COMPONENT: COMPARISON CARD ---
function CompareCard({ colA, colB, nameA, nameB }) {
  const typeMismatch = colA && colB && colA.type !== colB.type;
  const col = colA || colB;
  if (!col) return null;
  const type = col.type;

  const fmt = (n) => (n !== undefined && n !== null && !isNaN(n) ? n.toLocaleString() : "—");
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const theme = {
    numeric: { text: "text-blue-500", bg: "bg-blue-50", icon: faHashtag },
    date: { text: "text-purple-500", bg: "bg-purple-50", icon: faCalendar },
    categorical: { text: "text-amber-500", bg: "bg-amber-50", icon: faTag },
  };

  const currentTheme = theme[type] || theme.categorical;

  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-shadow ${typeMismatch ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className={`w-7 h-7 ${currentTheme.bg} rounded-lg flex items-center justify-center ${currentTheme.text}`}>
            <FontAwesomeIcon icon={currentTheme.icon} className="text-xs" />
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
            {col.name || "Unnamed Column"}
          </span>
        </div>
        {typeMismatch && (
          <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-md font-bold uppercase">Mismatch</span>
        )}
      </div>

      <div className="grid grid-cols-2 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-1.5 border-r border-gray-100 dark:border-gray-700">
          <span className="text-[10px] font-bold text-blue-500 truncate block">{nameA || "A"}</span>
        </div>
        <div className="px-4 py-1.5 text-right">
          <span className="text-[10px] font-bold text-emerald-500 truncate block">{nameB || "B"}</span>
        </div>
      </div>

      <div className="p-4 flex-1">
        {type === "numeric" && (
          <div className="space-y-3">
            {[{l:"Sum", f:"sum"}, {l:"Avg", f:"avg"}, {l:"Max", f:"max"}].map((m) => (
              <div key={m.l} className="space-y-1">
                <span className="text-[10px] text-gray-400 font-semibold">{m.l}</span>
                <div className="grid grid-cols-2 gap-4">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{fmt(colA?.[m.f])}</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 text-right">{fmt(colB?.[m.f])}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {type === "date" && (
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 h-full">
            {[colA, colB].map((c, i) => (
              <div key={i} className={`px-2 space-y-2 ${i === 1 ? 'text-right' : ''}`}>
                <span className="text-[10px] text-gray-400 font-semibold block">Range</span>
                {c?.min ? (
                  <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-snug">
                    <p>{fmtDate(c.min)}</p>
                    <p className="text-gray-400 font-normal">to</p>
                    <p>{fmtDate(c.max)}</p>
                  </div>
                ) : <span className="text-xs text-gray-300 italic text-gray-200">No data</span>}
              </div>
            ))}
          </div>
        )}

        {type === "categorical" && (
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 h-full gap-4">
            {[colA, colB].map((c, i) => (
              <div key={i} className="flex flex-col justify-between">
                <div className="space-y-2">
                  {c?.topValues?.slice(0, 2).map(([v, count]) => (
                    <div key={v}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="truncate text-gray-600 dark:text-gray-400">{v || "EMPTY"}</span>
                        <span className="font-bold text-gray-400">{count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full">
                        <div className="h-full bg-amber-400 rounded-full" style={{width: `${Math.min(100, (count/c.count)*100)}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-between items-center text-[10px]">
                  <span className="text-gray-400">Unique</span>
                  <span className="font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 rounded">{c?.unique || 0}</span>
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

  useEffect(() => { readAllData(); }, []);

  const savedSheets = useMemo(() => Array.isArray(dataSaved) ? dataSaved : (dataSaved?.data || []), [dataSaved]);

  const loadSheet = (name, source, setter) => {
    if (!name) { setter(null); return; }
    if (source === "loaded" && workbook) {
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, raw: false });
      setter({ name, data: json });
    } else {
      const found = savedSheets.find((s) => s.sheetName === name);
      if (found) setter({ name, data: found.fileData });
    }
  };

  const summaryA = useMemo(() => sheetA ? analyzeColumns(sheetA.data) : [], [sheetA]);
  const summaryB = useMemo(() => sheetB ? analyzeColumns(sheetB.data) : [], [sheetB]);

  const displayCols = useMemo(() => {
    const names = [...new Set([...summaryA.map(c => c.name), ...summaryB.map(c => c.name)])];
    return names.filter(name => {
      // FIX: Check if name exists before toLowerCase()
      const colName = name || "";
      const matchesSearch = colName.toLowerCase().includes((search || "").toLowerCase());
      
      if (!matchesSearch) return false;
      if (!onlyDiffs) return true;
      
      const cA = summaryA.find(c => c.name === name);
      const cB = summaryB.find(c => c.name === name);
      if (!cA || !cB || cA.type !== cB.type) return true;
      if (cA.type === 'numeric') return Math.abs((cA.sum || 0) - (cB.sum || 0)) > 0.01;
      return cA.unique !== cB.unique;
    });
  }, [summaryA, summaryB, onlyDiffs, search]);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        
        <div className="flex items-center gap-3 mb-6 max-w-4xl mx-auto">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FontAwesomeIcon icon={faCodeCompare} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Data Auditor</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Compare sheets from Excel or Database</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SheetPicker label="Primary Source (A)" workbook={workbook} savedSheets={savedSheets} value={sheetA} onChange={(n, s) => loadSheet(n, s, setSheetA)} />
          <SheetPicker label="Comparison Target (B)" workbook={workbook} savedSheets={savedSheets} value={sheetB} onChange={(n, s) => loadSheet(n, s, setSheetB)} />
        </div>

        {sheetA && sheetB && (
          <div className="max-w-4xl mx-auto mb-8 flex gap-3">
            <div className="relative flex-1">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input 
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter columns..."
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setOnlyDiffs(!onlyDiffs)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                onlyDiffs ? "bg-amber-500 border-amber-500 text-white shadow-sm" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300"
              }`}
            >
              <FontAwesomeIcon icon={faFilter} />
              {onlyDiffs ? "Differences Only" : "Show All"}
            </button>
          </div>
        )}

        {sheetA && sheetB ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Visible Columns:</span>
              <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-bold">{displayCols.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {displayCols.map((colName) => (
                <CompareCard key={colName} nameA={sheetA.name} nameB={sheetB.name}
                  colA={summaryA.find(c => c.name === colName)}
                  colB={summaryB.find(c => c.name === colName)} />
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-16 text-center shadow-sm">
            <p className="text-gray-400 text-sm font-medium">Select two sources to start the comparison</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- UPDATED PICKER WITH COLORED ICONS ---
function SheetPicker({ label, workbook, savedSheets, value, onChange }) {
  const [source, setSource] = useState("loaded");
  const options = source === "loaded" ? (workbook?.SheetNames || []) : savedSheets.map((s) => s.sheetName);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4 block">{label}</label>
      <div className="flex gap-2 mb-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-1">
        {[
          {id:"loaded", icon:faFileExcel, label:"Excel", color: "text-green-500"}, 
          {id:"saved", icon:faDatabase, label:"Database", color: "text-purple-500"}
        ].map((s) => (
          <button key={s.id} onClick={() => { setSource(s.id); onChange(null, s.id); }}
            className={`flex-1 flex items-center justify-center gap-2 text-xs py-2 rounded-lg font-bold transition-all ${
              source === s.id 
                ? "bg-white dark:bg-gray-800 text-gray-900 shadow-sm border border-gray-100 dark:border-gray-700" 
                : "text-gray-400 opacity-60 hover:opacity-100"
            }`}>
            <FontAwesomeIcon icon={s.icon} className={`text-xs ${s.color}`} />
            {s.label}
          </button>
        ))}
      </div>
      <select value={value?.name || ""} onChange={(e) => onChange(e.target.value, source)}
        className="w-full text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500">
        <option value="">Select sheet...</option>
        {options.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );
}

export default ComparePage;