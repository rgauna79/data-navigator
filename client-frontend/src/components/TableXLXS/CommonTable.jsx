import { useState, useMemo } from "react";
import Modal from "../reports/Modal.jsx";
import SaveDialog from "./SaveDialog.jsx";
import ExportMenu from "./ExportMenu.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk, faXmark, faChartBar, faSearch,
  faChevronUp, faChevronDown, faChevronLeft, faChevronRight,
  faAnglesLeft, faAnglesRight, faPalette, faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { flexRender } from "@tanstack/react-table";
import { minMax, numericValues, toNumber } from "../../utils/excelUtils.js";

// Calcula min/max por columna numérica
const getColumnRanges = (data, numericCols) => {
  const ranges = {};
  numericCols.forEach((col) => {
    const vals = numericValues(data.map((r) => r[col]));
    if (vals.length > 0) ranges[col] = minMax(vals);
  });
  return ranges;
};

const filterInput =
  "w-full min-w-20 px-2 py-1 text-xs font-normal normal-case tracking-normal bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500";

// Filtro de una columna según su tipo (ver DataTable: meta.type)
function ColumnFilter({ column }) {
  const type = column.columnDef.meta?.type;
  const value = column.getFilterValue();
  const label = column.columnDef.header;

  if (type === "numeric") {
    const [min = "", max = ""] = value || [];
    return (
      <div className="flex gap-1">
        <input
          inputMode="decimal"
          placeholder="Min"
          aria-label={`${label} minimum`}
          value={min}
          onChange={(e) => column.setFilterValue([e.target.value, max])}
          className={filterInput}
        />
        <input
          inputMode="decimal"
          placeholder="Max"
          aria-label={`${label} maximum`}
          value={max}
          onChange={(e) => column.setFilterValue([min, e.target.value])}
          className={filterInput}
        />
      </div>
    );
  }

  if (type === "date") {
    const { from = "", to = "" } = value || {};
    return (
      <div className="flex flex-col gap-1">
        <input
          type="date"
          aria-label={`${label} from`}
          value={from}
          onChange={(e) => column.setFilterValue({ from: e.target.value, to })}
          className={filterInput}
        />
        <input
          type="date"
          aria-label={`${label} to`}
          value={to}
          onChange={(e) => column.setFilterValue({ from, to: e.target.value })}
          className={filterInput}
        />
      </div>
    );
  }

  return (
    <input
      placeholder="Contains..."
      aria-label={`Filter ${label}`}
      value={value ?? ""}
      onChange={(e) => column.setFilterValue(e.target.value)}
      className={filterInput}
    />
  );
}

// Genera clase de color condicional para una celda numérica
const getHeatClass = (value, range) => {
  if (!range || range.max === range.min) return "";
  const n = toNumber(value);
  if (isNaN(n)) return "";
  const pct = (n - range.min) / (range.max - range.min);
  if (pct >= 0.8) return "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-medium";
  if (pct >= 0.6) return "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300";
  if (pct >= 0.4) return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300";
  if (pct >= 0.2) return "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300";
  return "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
};

function CommonTable({
  data, table, headers, numericCols, columnTypes, sheetName, fileData, handleCloseTable,
  showSaveButton = false, globalFilter, setGlobalFilter,
}) {
  const [showModal, setShowModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  // Nombre con el que se guardó la hoja, para el aviso de éxito
  const [savedName, setSavedName] = useState("");
  const [heatmap, setHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const activeColumnFilters = table.getState().columnFilters.length;

  const colRanges = useMemo(() => getColumnRanges(data, numericCols), [data, numericCols]);

  const handleSaved = (name) => {
    setShowSaveDialog(false);
    setSavedName(name);
    setTimeout(() => setSavedName(""), 4000);
  };

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const columns = headers.map((header, i) => ({ Header: header, accessor: i }));

  return (
    <div className="flex flex-col gap-4 w-full">
      {data && data.length > 0 ? (
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
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            {numericCols.size > 0 && (
              <button
                onClick={() => setHeatmap((v) => !v)}
                title="Toggle color heatmap for numeric columns"
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
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-pressed={showFilters}
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400"
              }`}
            >
              <FontAwesomeIcon icon={faFilter} className="text-xs" />
              Filters
              {activeColumnFilters > 0 && (
                <span className={`text-xs rounded-full px-1.5 ${showFilters ? "bg-white/25" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"}`}>
                  {activeColumnFilters}
                </span>
              )}
            </button>
            {activeColumnFilters > 0 && (
              <button
                onClick={() => table.resetColumnFilters()}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline px-1"
              >
                Clear filters
              </button>
            )}
            <ExportMenu
              headers={headers}
              // Filas filtradas y ordenadas, sin paginar
              getRows={() => table.getPrePaginationRowModel().rows.map((r) => r.original)}
              numericCols={numericCols}
              sheetName={sheetName}
              isFiltered={Boolean(globalFilter) || activeColumnFilters > 0}
            />
          </div>

          {/* Toasts */}
          {savedName && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 text-sm px-4 py-2 rounded-lg">
              ✓ <strong>{savedName}</strong> saved successfully.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {showModal && (
              <Modal handleClose={() => setShowModal(false)} columns={columns} columnTypes={columnTypes} data={data} />
            )}
            {showSaveDialog && (
              <SaveDialog
                defaultName={sheetName}
                fileData={fileData}
                onClose={() => setShowSaveDialog(false)}
                onSaved={handleSaved}
              />
            )}
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              onClick={() => setShowModal(true)}
            >
              <FontAwesomeIcon icon={faChartBar} /> Generate Report
            </button>
            {showSaveButton && (
              <button
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                onClick={() => setShowSaveDialog(true)}
              >
                <FontAwesomeIcon icon={faFloppyDisk} /> Save Data
              </button>
            )}
            {handleCloseTable && (
              <button
                className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white text-sm px-4 py-2 rounded-lg transition-colors ml-auto"
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
                <span key={c} className={`w-5 h-3 rounded-sm ${c} border border-gray-200`} />
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
                {showFilters && (
                  <tr>
                    {table.getHeaderGroups()[0].headers.map((header) => (
                      <th key={header.id} className="px-2 py-2 align-top border-b border-gray-200 dark:border-gray-600">
                        <ColumnFilter column={header.column} />
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={headers.length} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No rows match the current search or filters.
                    </td>
                  </tr>
                )}
                {table.getRowModel().rows.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`${i % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800/60"} hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors`}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = numericCols.has(cell.column.id);
                      const val = cell.getValue();
                      const heatClass = heatmap && isNumeric && val !== "" && val !== null
                        ? getHeatClass(val, colRanges[cell.column.id])
                        : "";
                      return (
                        <td
                          key={cell.id}
                          className={`px-4 py-2.5 whitespace-nowrap transition-colors ${
                            heatClass || "text-gray-700 dark:text-gray-300"
                          }`}
                        >
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
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
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
      ) : (
        <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No data to display.
          </p>
        </div>
      )}
    </div>
  );
}

export default CommonTable;