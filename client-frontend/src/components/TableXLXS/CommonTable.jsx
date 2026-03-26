import React, { useState, useMemo } from "react";
import Modal from "../reports/Modal.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faFloppyDisk, faXmark, faChartBar, faSearch,
  faChevronUp, faChevronDown, faChevronLeft, faChevronRight,
  faAnglesLeft, faAnglesRight, faPalette, faFileExcel, faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import { flexRender } from "@tanstack/react-table";
import { useDataContext } from "../../context/DataContext.jsx";
import * as XLSX from "xlsx";

const detectNumericColumns = (data) => {
  if (!data || data.length === 0) return new Set();
  const numeric = new Set();
  Object.keys(data[0]).forEach((key) => {
    const vals = data.map((r) => r[key]).filter((v) => v !== "" && v !== null);
    const numCount = vals.filter((v) => !isNaN(parseFloat(v)) && isFinite(v)).length;
    if (vals.length > 0 && numCount / vals.length > 0.6) numeric.add(key);
  });
  return numeric;
};

const getColumnRanges = (data, numericCols) => {
  const ranges = {};
  numericCols.forEach((col) => {
    const vals = data.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
    if (vals.length > 0) ranges[col] = { min: Math.min(...vals), max: Math.max(...vals) };
  });
  return ranges;
};

const getHeatClass = (value, range) => {
  if (!range || range.max === range.min) return "";
  const pct = (parseFloat(value) - range.min) / (range.max - range.min);
  if (pct >= 0.8) return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium";
  if (pct >= 0.6) return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300";
  if (pct >= 0.4) return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300";
  if (pct >= 0.2) return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300";
  return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
};

function CommonTable({
  data, table, handleCloseTable, handleSaveData,
  showSaveButton = false, globalFilter, setGlobalFilter,
}) {
  const { selectedSheet, fileData } = useDataContext();
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [heatmap, setHeatmap] = useState(false);

  const numericCols = useMemo(() => detectNumericColumns(data), [data]);
  const colRanges = useMemo(() => getColumnRanges(data, numericCols), [data, numericCols]);

  const handleSaveDataClick = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await handleSaveData({ sheetName: selectedSheet, fileData });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Exportar a Excel
  const handleExportExcel = () => {
    const exportData = table.getFilteredRowModel().rows.map((row) => {
      const obj = {};
      row.getVisibleCells().forEach((cell) => {
        obj[cell.column.columnDef.header] = cell.getValue();
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedSheet || "Sheet1");
    XLSX.writeFile(wb, `${selectedSheet || "export"}.xlsx`);
  };

  // ✅ Exportar a CSV
  const handleExportCsv = () => {
    const exportData = table.getFilteredRowModel().rows.map((row) => {
      const obj = {};
      row.getVisibleCells().forEach((cell) => {
        obj[cell.column.columnDef.header] = cell.getValue();
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSheet || "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const columns = table.getAllColumns().map((col) => ({
    Header: col.columnDef.header,
    accessor: col.id,
  }));

  return (
    <div className="flex flex-col gap-4 w-full">
      {data && data.length > 0 && (
        <>
          {/* Search + heatmap toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search all columns..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            {numericCols.size > 0 && (
              <button
                onClick={() => setHeatmap((v) => !v)}
                className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                  heatmap
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400"
                }`}
              >
                <FontAwesomeIcon icon={faPalette} className="text-xs" />
                Heatmap
              </button>
            )}
          </div>

          {/* Toasts */}
          {saveStatus === "success" && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm px-4 py-2 rounded-lg">
              ✓ <strong>{selectedSheet}</strong> saved successfully.
            </div>
          )}
          {saveStatus === "error" && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-2 rounded-lg">
              ✗ Error saving. Please try again.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {showModal && <Modal handleClose={() => setShowModal(false)} columns={columns} data={data} />}

            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              onClick={() => setShowModal(true)}
            >
              <FontAwesomeIcon icon={faChartBar} /> Generate Report
            </button>

            {showSaveButton && (
              <button
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                onClick={handleSaveDataClick}
              >
                {isSaving
                  ? <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</>
                  : <><FontAwesomeIcon icon={faFloppyDisk} /> Save Data</>
                }
              </button>
            )}

            {/* ✅ Export buttons */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm px-3 py-2 rounded-lg transition-colors"
                title="Export to Excel"
              >
                <FontAwesomeIcon icon={faFileExcel} className="text-xs" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded-lg transition-colors"
                title="Export to CSV"
              >
                <FontAwesomeIcon icon={faFileCsv} className="text-xs" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>

            {handleCloseTable && (
              <button
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                onClick={handleCloseTable}
              >
                <FontAwesomeIcon icon={faXmark} /> Close
              </button>
            )}
          </div>

          {/* Heatmap legend */}
          {heatmap && numericCols.size > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Low</span>
              {["bg-green-100","bg-blue-100","bg-yellow-100","bg-orange-100","bg-red-100"].map((c) => (
                <span key={c} className={`w-5 h-3 rounded ${c} border border-gray-200`} />
              ))}
              <span>High</span>
              <span className="ml-2 text-gray-400">· numeric columns only</span>
            </div>
          )}

          {/* Table */}
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`px-4 py-3 font-medium text-xs uppercase tracking-wide whitespace-nowrap border-b border-gray-200 dark:border-gray-600 ${
                          header.column.getCanSort() ? "cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-gray-600/60" : ""
                        } ${numericCols.has(header.id) && heatmap ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                      >
                        <span className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" && <FontAwesomeIcon icon={faChevronUp} className="text-blue-500 text-xs" />}
                          {header.column.getIsSorted() === "desc" && <FontAwesomeIcon icon={faChevronDown} className="text-blue-500 text-xs" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`${i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/60"} hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors`}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = numericCols.has(cell.column.id);
                      const val = cell.getValue();
                      const heatClass = heatmap && isNumeric && val !== "" && val !== null
                        ? getHeatClass(val, colRanges[cell.column.id]) : "";
                      return (
                        <td key={cell.id} className={`px-4 py-2.5 whitespace-nowrap transition-colors ${heatClass || "text-gray-700 dark:text-gray-300"}`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400 pb-2">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[10, 15, 25, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="text-xs">
              Page <strong>{pageIndex + 1}</strong> of <strong>{pageCount || 1}</strong>
              {" "}· {table.getFilteredRowModel().rows.length} rows
            </span>
            <div className="flex items-center gap-1">
              {[
                { icon: faAnglesLeft,   action: () => table.setPageIndex(0),           disabled: !canPreviousPage },
                { icon: faChevronLeft,  action: () => table.previousPage(),             disabled: !canPreviousPage },
                { icon: faChevronRight, action: () => table.nextPage(),                 disabled: !canNextPage },
                { icon: faAnglesRight,  action: () => table.setPageIndex(pageCount-1), disabled: !canNextPage },
              ].map(({ icon, action, disabled }, i) => (
                <button key={i} onClick={action} disabled={disabled}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FontAwesomeIcon icon={icon} className="text-xs" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CommonTable;