import React, { useState, useMemo, useEffect, useRef } from "react";
import Modal from "../reports/Modal.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faFloppyDisk,
  faXmark,
  faChartBar,
  faSearch,
  faChevronUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faAnglesLeft,
  faAnglesRight,
  faPalette,
  faEye,
  faDownload,
  faFilter,
  faTable,
  faPen,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { flexRender } from "@tanstack/react-table";
import { useDataContext } from "../../context/DataContext.jsx";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

// --- Componente de Celda Editable ---
const EditableCell = ({ getValue, row: { index }, column: { id }, table }) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      // ✅ Pasamos el initialValue al updateData para el historial
      table.options.meta?.updateData(index, id, value, initialValue);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") onBlur();
    if (e.key === "Escape") {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full bg-blue-50 dark:bg-blue-900/30 border border-blue-500 rounded px-2 py-0.5 outline-none text-gray-900 dark:text-white font-bold shadow-sm"
      />
    );
  }

  return (
    <div
      onDoubleClick={() => table.options.meta?.updateData && setIsEditing(true)}
      className={`group cursor-text min-h-[24px] flex items-center justify-between gap-2 px-1 -mx-1 rounded transition-colors ${
        table.options.meta?.updateData
          ? "hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
          : ""
      }`}
      title={table.options.meta?.updateData ? "Double click to edit" : ""}
    >
      <span className="truncate">{value}</span>
      {table.options.meta?.updateData && (
        <FontAwesomeIcon
          icon={faPen}
          className="text-[10px] opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity"
        />
      )}
    </div>
  );
};

// --- Funciones de Utilidad ---
const detectNumericColumns = (data) => {
  if (!data || data.length === 0) return new Set();
  const numeric = new Set();
  Object.keys(data[0]).forEach((key) => {
    const vals = data.map((r) => r[key]).filter((v) => v !== "" && v !== null);
    const numCount = vals.filter(
      (v) => !isNaN(parseFloat(v)) && isFinite(v)
    ).length;
    if (vals.length > 0 && numCount / vals.length > 0.6) numeric.add(key);
  });
  return numeric;
};

const getColumnRanges = (data, numericCols) => {
  const ranges = {};
  numericCols.forEach((col) => {
    const vals = data.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
    if (vals.length > 0)
      ranges[col] = { min: Math.min(...vals), max: Math.max(...vals) };
  });
  return ranges;
};

const getHeatClass = (value, range) => {
  if (!range || range.max === range.min) return "";
  const pct = (parseFloat(value) - range.min) / (range.max - range.min);
  if (pct >= 0.8)
    return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium";
  if (pct >= 0.6)
    return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300";
  if (pct >= 0.4)
    return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300";
  if (pct >= 0.2)
    return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300";
  return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
};

// --- Componente Principal ---
function CommonTable({
  data,
  table,
  handleCloseTable,
  handleSaveTrigger,
  showSaveButton = false,
  globalFilter,
  setGlobalFilter,
  canUndo = false, // ✅ Recibimos canUndo
  onUndo = () => {}, // ✅ Recibimos onUndo
}) {
  const { selectedSheet, isSaving } = useDataContext();
  const [showModal, setShowModal] = useState(false);
  const [heatmap, setHeatmap] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showVisMenu, setShowVisMenu] = useState(false);

  const exportRef = useRef(null);
  const visRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target))
        setShowExportMenu(false);
      if (visRef.current && !visRef.current.contains(event.target))
        setShowVisMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const numericCols = useMemo(() => detectNumericColumns(data), [data]);
  const colRanges = useMemo(
    () => getColumnRanges(data, numericCols),
    [data, numericCols]
  );

  const handleExport = (format, exportAllRows) => {
    const rowsToExport = exportAllRows
      ? table.getCoreRowModel().rows
      : table.getFilteredRowModel().rows;
    const exportData = rowsToExport.map((row) => {
      const obj = {};
      row.getVisibleCells().forEach((cell) => {
        obj[cell.column.columnDef.header] = cell.getValue();
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const fileName = `${selectedSheet || "export"}_${
      exportAllRows ? "ALL" : "FILTERED"
    }`;

    if (format === "excel") {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedSheet || "Sheet1");
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    } else if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8;" })
      );
      a.download = `${fileName}.csv`;
      a.click();
    }
    setShowExportMenu(false);
    toast.success(`Exported ${fileName} successfully!`);
  };

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const columns = table
    .getAllColumns()
    .map((col) => ({ Header: col.columnDef.header, accessor: col.id }));

  return (
    <div className="flex flex-col gap-4 w-full">
      {data && data.length > 0 && (
        <>
          {showModal && (
            <Modal
              handleClose={() => setShowModal(false)}
              columns={columns}
              data={data}
            />
          )}

          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  type="text"
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search all columns..."
                  className="w-full pl-9 pr-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
                />
              </div>

              {numericCols.size > 0 && (
                <button
                  onClick={() => setHeatmap((v) => !v)}
                  className={`flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl border transition-all shadow-sm ${
                    heatmap
                      ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={faPalette}
                    className={heatmap ? "text-amber-500" : ""}
                  />{" "}
                  Heatmap
                </button>
              )}

              <div className="relative" ref={visRef}>
                <button
                  onClick={() => setShowVisMenu(!showVisMenu)}
                  className="flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <FontAwesomeIcon icon={faEye} /> Columns{" "}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="text-[10px] ml-1 opacity-50"
                  />
                </button>

                {showVisMenu && (
                  <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <label className="flex items-center gap-2 px-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={table.getIsAllColumnsVisible()}
                          onChange={table.getToggleAllColumnsVisibilityHandler()}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          Toggle All
                        </span>
                      </label>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {table.getAllLeafColumns().map((column) => (
                        <label
                          key={column.id}
                          className="flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {column.columnDef.header}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
              onClick={() => setShowModal(true)}
            >
              <FontAwesomeIcon icon={faChartBar} /> Generate Report
            </button>

            {showSaveButton && (
              <button
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                onClick={handleSaveTrigger}
              >
                {isSaving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Saving...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFloppyDisk} /> Save Data
                  </>
                )}
              </button>
            )}

            {/* ✅ Botón Undo */}
            {canUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 animate-in pop-in"
                title="Undo last edit"
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Undo
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <div className="relative" ref={exportRef}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  <FontAwesomeIcon icon={faDownload} /> Export{" "}
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="text-[10px] ml-1 opacity-50"
                  />
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Excel (.xlsx)
                      </span>
                    </div>
                    <button
                      onClick={() => handleExport("excel", true)}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 transition-colors flex items-center justify-between"
                    >
                      <span>
                        <FontAwesomeIcon
                          icon={faTable}
                          className="mr-2 text-gray-400"
                        />
                        All Data
                      </span>
                    </button>
                    <button
                      onClick={() => handleExport("excel", false)}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 transition-colors flex items-center justify-between"
                    >
                      <span>
                        <FontAwesomeIcon
                          icon={faFilter}
                          className="mr-2 text-gray-400"
                        />
                        Filtered View
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {handleCloseTable && (
                <button
                  className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-sm px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                  onClick={handleCloseTable}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              )}
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 mt-2">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 border-b border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="px-4 py-3.5 font-bold text-xs uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getIsSorted() === "asc" && (
                            <FontAwesomeIcon
                              icon={faChevronUp}
                              className="text-blue-500 text-xs"
                            />
                          )}
                          {header.column.getIsSorted() === "desc" && (
                            <FontAwesomeIcon
                              icon={faChevronDown}
                              className="text-blue-500 text-xs"
                            />
                          )}
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
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = numericCols.has(cell.column.id);
                      const val = cell.getValue();
                      const heatClass =
                        heatmap && isNumeric && val !== "" && val !== null
                          ? getHeatClass(val, colRanges[cell.column.id])
                          : "";

                      return (
                        <td
                          key={cell.id}
                          className={`px-4 py-2 whitespace-nowrap font-medium ${
                            heatClass || "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <EditableCell
                            getValue={cell.getValue}
                            row={cell.row}
                            column={cell.column}
                            table={table}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="font-medium">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border rounded-lg px-3 py-1.5 text-sm font-bold"
              >
                {[10, 15, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-medium">
                Page{" "}
                <strong className="text-gray-900 dark:text-white">
                  {pageIndex + 1}
                </strong>{" "}
                of{" "}
                <strong className="text-gray-900 dark:text-white">
                  {pageCount || 1}
                </strong>
              </span>
              <div className="flex items-center gap-1">
                {[
                  {
                    icon: faAnglesLeft,
                    action: () => table.setPageIndex(0),
                    disabled: !table.getCanPreviousPage(),
                  },
                  {
                    icon: faChevronLeft,
                    action: () => table.previousPage(),
                    disabled: !table.getCanPreviousPage(),
                  },
                  {
                    icon: faChevronRight,
                    action: () => table.nextPage(),
                    disabled: !table.getCanNextPage(),
                  },
                  {
                    icon: faAnglesRight,
                    action: () => table.setPageIndex(pageCount - 1),
                    disabled: !table.getCanNextPage(),
                  },
                ].map(({ icon, action, disabled }, i) => (
                  <button
                    key={i}
                    onClick={action}
                    disabled={disabled}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-100 transition-colors"
                  >
                    <FontAwesomeIcon icon={icon} className="text-xs" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CommonTable;
