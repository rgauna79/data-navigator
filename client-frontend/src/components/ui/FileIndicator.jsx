import React from "react";
import { Link } from "react-router-dom";
import { useDataContext } from "../../context/DataContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faXmark } from "@fortawesome/free-solid-svg-icons";

// Badge pequeño para la navbar
export function NavFileIndicator() {
  const { fileData, selectedSheet, resetExcel } = useDataContext();
  if (!fileData || fileData.length === 0) return null;

  return (
    <Link
      to="/filereader"
      className="hidden md:flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors max-w-[160px]"
      title={`File loaded: ${selectedSheet}`}
    >
      <FontAwesomeIcon
        icon={faFileExcel}
        className="text-green-400 flex-shrink-0"
      />
      <span className="truncate">{selectedSheet}</span>
    </Link>
  );
}

// Banner para la HomePage
export function HomeFileIndicator() {
  const { fileData, selectedSheet, workbook, resetExcel } = useDataContext();
  if (!fileData || fileData.length === 0) return null;

  const rowCount = Math.max(0, fileData.length - 1);
  const sheetCount = workbook?.SheetNames?.length || 1;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-green-100 dark:bg-green-800/40 rounded-xl flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon
            icon={faFileExcel}
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300 truncate">
            File loaded: <span className="font-bold">{selectedSheet}</span>
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">
            {rowCount.toLocaleString()} rows · {sheetCount} sheet
            {sheetCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          to="/filereader"
          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          Open
        </Link>
        <button
          onClick={resetExcel}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500 hover:bg-green-100 dark:hover:bg-green-800/40 transition-colors"
          title="Clear loaded file"
        >
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
        </button>
      </div>
    </div>
  );
}
