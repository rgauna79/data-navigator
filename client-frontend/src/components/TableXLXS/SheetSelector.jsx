import React from "react";
import { useDataContext } from "../../context/DataContext";
import { analyzeColumns } from "../../hooks/useExcelData.js";
import * as XLSX from "xlsx";

function SheetSelector() {
  const {
    workbook, fileData, selectedSheet,
    setSelectedSheet, setFileData, setColumnAnalysis
  } = useDataContext();

  if (!workbook || !fileData) {
    return (
      <div className="flex items-center mt-4 justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  const formatJson = (json) =>
    json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );

  // ✅ Al cambiar sheet: recarga datos Y recalcula análisis de columnas
  const handleSheetChange = (e) => {
    const sheetName = e.target.value;
    setSelectedSheet(sheetName);

    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
    const formatted = formatJson(json);
    setFileData(formatted);
    setColumnAnalysis(analyzeColumns(formatted)); // ✅ recalcula stats
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4">
      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
        Select sheet to show:
      </span>
      <select
        name="sheetDropdown"
        id="sheetDropdown"
        className="w-full sm:w-auto text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        onChange={handleSheetChange}
        value={selectedSheet}
      >
        {workbook.SheetNames.map((sheetName) => (
          <option key={sheetName} value={sheetName}>
            {sheetName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SheetSelector;