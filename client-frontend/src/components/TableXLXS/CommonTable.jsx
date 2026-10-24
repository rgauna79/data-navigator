import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Modal from "../reports/Modal.jsx";
import SaveDialog from "./SaveDialog.jsx";
import ExportMenu from "./ExportMenu.jsx";
import CleanupDialog from "./CleanupDialog.jsx";
import DatePresetSelect from "../DatePresetSelect.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFloppyDisk, faXmark, faChartBar, faSearch,
  faChevronUp, faChevronDown, faChevronLeft, faChevronRight,
  faAnglesLeft, faAnglesRight, faPalette, faFilter, faEye, faPen, faRotateLeft, faBroom, faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { flexRender } from "@tanstack/react-table";
import { minMax, numericValues, parseDate, toNumber } from "../../utils/excelUtils.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

// Calcula min/max por columna numérica
const getColumnRanges = (data, numericCols, columnTypes) => {
  const ranges = {};
  numericCols.forEach((col) => {
    const vals = numericValues(data.map((r) => r[col]), columnTypes[col]?.decimal);
    if (vals.length > 0) ranges[col] = minMax(vals);
  });
  return ranges;
};

const filterInput =
  "w-full min-w-20 px-2 py-1 text-xs font-normal normal-case tracking-normal bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500";

const toolbarButton = (active) =>
  `flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl border transition-all shadow-xs ${
    active
      ? "bg-blue-600 border-blue-600 text-white"
      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400"
  }`;

// "YYYY-MM-DD" (filtro de fechas) como fecha local
const inputToDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Filtro de una columna según su tipo (ver DataTable: meta.type)
// dates: fechas de la columna, para el selector de período rápido
function ColumnFilter({ column, dates }) {
  const { t } = useI18n();
  const type = column.columnDef.meta?.type;
  const value = column.getFilterValue();
  const label = column.columnDef.header;

  if (type === "numeric") {
    const [min = "", max = ""] = value || [];
    return (
      <div className="flex gap-1">
        <input
          inputMode="decimal"
          placeholder={t("Min")}
          aria-label={t("{name} minimum", { name: label })}
          value={min}
          onChange={(e) => column.setFilterValue([e.target.value, max])}
          className={filterInput}
        />
        <input
          inputMode="decimal"
          placeholder={t("Max")}
          aria-label={t("{name} maximum", { name: label })}
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
          aria-label={t("{name} from", { name: label })}
          value={from}
          onChange={(e) => column.setFilterValue({ from: e.target.value, to })}
          className={filterInput}
        />
        <input
          type="date"
          aria-label={t("{name} to", { name: label })}
          value={to}
          onChange={(e) => column.setFilterValue({ from, to: e.target.value })}
          className={filterInput}
        />
        <DatePresetSelect
          dates={dates}
          onSelect={(range) => column.setFilterValue(range ?? undefined)}
          label={t("Quick period for {name}", { name: label })}
          className={filterInput}
        />
      </div>
    );
  }

  return (
    <input
      placeholder={t("Contains...")}
      aria-label={t("Filter {name}", { name: label })}
      value={value ?? ""}
      onChange={(e) => column.setFilterValue(e.target.value)}
      className={filterInput}
    />
  );
}

// Celda que se edita con doble clic (limpieza de datos). Enter o salir del
// campo guarda el cambio; Escape lo descarta.
function EditableCell({ cell, table, alignRight = false }) {
  const { t } = useI18n();
  const initialValue = cell.getValue() ?? "";
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    setValue(initialValue);
    setIsEditing(true);
  };

  const commit = () => {
    setIsEditing(false);
    if (String(value) !== String(initialValue)) {
      table.options.meta.updateData(cell.row.original, Number(cell.column.id), value);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        aria-label={t("Edit {name}", { name: cell.column.columnDef.header })}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setIsEditing(false);
        }}
        className="w-full min-w-24 bg-blue-50 dark:bg-blue-900/30 border border-blue-500 rounded-sm px-2 py-0.5 outline-hidden text-gray-900 dark:text-white font-bold shadow-xs"
      />
    );
  }

  return (
    <div
      onDoubleClick={startEditing}
      className={`group cursor-text min-h-[24px] flex items-center justify-between gap-2 px-1 -mx-1 rounded-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 ${
        alignRight ? "flex-row-reverse" : ""
      }`}
      title={t("Double click to edit")}
    >
      <span className="truncate">{initialValue}</span>
      <FontAwesomeIcon icon={faPen} className="text-[10px] opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
    </div>
  );
}

// Menú para mostrar u ocultar columnas
function ColumnsMenu({ table }) {
  const { t, fmtNumber } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hidden = table.getAllLeafColumns().filter((c) => !c.getIsVisible()).length;

  // Cierra el menú al hacer clic fuera o pulsar Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className={toolbarButton(hidden > 0)}>
        <FontAwesomeIcon icon={faEye} className="text-xs" /> {t("Columns")}
        {hidden > 0 && (
          <span className="text-xs rounded-full px-1.5 bg-white/25">{t("{count} hidden", { count: fmtNumber(hidden) })}</span>
        )}
        <FontAwesomeIcon icon={faChevronDown} className="text-[10px] opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <label className="flex items-center gap-2 px-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={table.getIsAllColumnsVisible()}
                onChange={table.getToggleAllColumnsVisibilityHandler()}
                className="rounded-sm border-gray-300 text-blue-600"
              />
              <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">{t("Show all")}</span>
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
                  className="rounded-sm border-gray-300 text-blue-600"
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
  );
}

// Genera clase de color condicional para una celda numérica
const getHeatClass = (value, range, decimal) => {
  if (!range || range.max === range.min) return "";
  const n = toNumber(value, decimal);
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
  editable = false, canUndo = false, onUndo,
}) {
  const { t, tn, fmtNumber, fmtDate } = useI18n();
  const [showCleanup, setShowCleanup] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [heatmap, setHeatmap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const activeColumnFilters = table.getState().columnFilters.length;

  const colRanges = useMemo(() => getColumnRanges(data, numericCols, columnTypes), [data, numericCols, columnTypes]);

  // Fechas de cada columna de fecha, para filtrar por mes, trimestre o año
  const datesByColumn = useMemo(() => {
    const result = {};
    columnTypes.forEach((type, i) => {
      if (type?.type === "date") result[i] = data.map((row) => parseDate(row[i], type.dateOrder));
    });
    return result;
  }, [data, columnTypes]);
  const mainDateIdx = Object.keys(datesByColumn)[0];
  const mainDateColumn = mainDateIdx !== undefined ? table.getColumn(mainDateIdx) : null;
  const periodFilter = mainDateColumn?.getFilterValue();

  const handleSaved = (name) => {
    setShowSaveDialog(false);
    toast.success(t('"{name}" saved successfully!', { name }));
  };

  // La exportación respeta las columnas visibles
  const visibleIdx = table.getVisibleLeafColumns().map((c) => Number(c.id));
  const exportHeaders = visibleIdx.map((i) => headers[i]);
  const exportNumeric = new Set(
    visibleIdx.map((orig, pos) => (numericCols.has(String(orig)) ? String(pos) : null)).filter(Boolean)
  );

  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  const columns = headers.map((header, i) => ({ Header: header, accessor: i }));

  return (
    <div className="flex flex-col gap-4 w-full">
      {data && data.length > 0 ? (
        <>
          {showModal && (
            <Modal handleClose={() => setShowModal(false)} columns={columns} columnTypes={columnTypes} data={data} sheetName={sheetName} />
          )}
          {showCleanup && (
            <CleanupDialog
              rows={fileData}
              headers={headers}
              columnTypes={columnTypes}
              onClose={() => setShowCleanup(false)}
            />
          )}
          {showSaveDialog && (
            <SaveDialog
              defaultName={sheetName}
              fileData={fileData}
              onClose={() => setShowSaveDialog(false)}
              onSaved={handleSaved}
            />
          )}

          {/* Search, view options and export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={t("Search all columns...")}
                className="w-full pl-9 pr-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-colors shadow-xs"
              />
            </div>
            {numericCols.size > 0 && (
              <button
                onClick={() => setHeatmap((v) => !v)}
                title={t("Toggle color heatmap for numeric columns")}
                aria-pressed={heatmap}
                className={toolbarButton(heatmap)}
              >
                <FontAwesomeIcon icon={faPalette} className="text-xs" />
                {t("Heatmap")}
              </button>
            )}
            <button onClick={() => setShowFilters((v) => !v)} aria-pressed={showFilters} className={toolbarButton(showFilters)}>
              <FontAwesomeIcon icon={faFilter} className="text-xs" />
              {t("Filters")}
              {activeColumnFilters > 0 && (
                <span className={`text-xs rounded-full px-1.5 ${showFilters ? "bg-white/25" : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"}`}>
                  {activeColumnFilters}
                </span>
              )}
            </button>
            {mainDateColumn && (
              <div className="flex items-center gap-2 text-sm">
                <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400 text-xs" />
                <DatePresetSelect
                  dates={datesByColumn[mainDateIdx]}
                  onSelect={(range) => mainDateColumn.setFilterValue(range ?? undefined)}
                  label={t("Quick period for {name}", { name: headers[mainDateIdx] })}
                  className="text-sm font-bold px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                {(periodFilter?.from || periodFilter?.to) && (
                  <span className="flex items-center gap-1 text-xs font-bold rounded-full pl-2.5 pr-1 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {headers[mainDateIdx]}: {periodFilter.from ? fmtDate(inputToDate(periodFilter.from)) : "…"} → {periodFilter.to ? fmtDate(inputToDate(periodFilter.to)) : "…"}
                    <button
                      onClick={() => mainDateColumn.setFilterValue(undefined)}
                      aria-label={t("Remove period filter")}
                      className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
                    </button>
                  </span>
                )}
              </div>
            )}
            {activeColumnFilters > 0 && (
              <button
                onClick={() => table.resetColumnFilters()}
                className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline px-1"
              >
                {t("Clear filters")}
              </button>
            )}
            <ColumnsMenu table={table} />
            <ExportMenu
              headers={exportHeaders}
              // Filas filtradas y ordenadas, sin paginar, solo con las columnas visibles
              getRows={() => table.getPrePaginationRowModel().rows.map((r) => visibleIdx.map((i) => r.original[i]))}
              numericCols={exportNumeric}
              decimalOf={(pos) => columnTypes[visibleIdx[pos]]?.decimal}
              sheetName={sheetName}
              isFiltered={Boolean(globalFilter) || activeColumnFilters > 0}
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95"
              onClick={() => setShowModal(true)}
            >
              <FontAwesomeIcon icon={faChartBar} /> {t("Generate Report")}
            </button>
            {showSaveButton && (
              <button
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95"
                onClick={() => setShowSaveDialog(true)}
              >
                <FontAwesomeIcon icon={faFloppyDisk} /> {t("Save Data")}
              </button>
            )}
            {editable && (
              <button
                onClick={() => setShowCleanup(true)}
                className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-400 text-gray-700 dark:text-gray-200 font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95"
              >
                <FontAwesomeIcon icon={faBroom} className="text-blue-500" /> {t("Clean data")}
              </button>
            )}
            {canUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 font-bold text-sm px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95"
                title={t("Undo last edit")}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> {t("Undo edit")}
              </button>
            )}
            {editable && (
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                {t("Double click a cell to edit it")}
              </span>
            )}
            {handleCloseTable && (
              <button
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold text-sm px-4 py-2 rounded-xl transition-all ml-auto"
                onClick={handleCloseTable}
              >
                <FontAwesomeIcon icon={faXmark} /> {t("Close")}
              </button>
            )}
          </div>

          {/* Heatmap legend */}
          {heatmap && numericCols.size > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{t("Low")}</span>
              {["bg-green-100","bg-blue-100","bg-yellow-100","bg-orange-100","bg-red-100"].map((c) => (
                <span key={c} className={`w-5 h-3 rounded-xs ${c} border border-gray-200`} />
              ))}
              <span>{t("High")}</span>
              <span className="ml-2 text-gray-400">· {t("numeric columns only")}</span>
            </div>
          )}

          {/* Table */}
          <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs bg-white dark:bg-gray-800">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={`px-4 py-3.5 font-bold text-xs uppercase tracking-wider whitespace-nowrap border-b border-gray-200 dark:border-gray-700 ${
                          header.column.getCanSort() ? "cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700/60" : ""
                        } ${numericCols.has(header.id) && heatmap ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                      >
                        {/* Los números se alinean a la derecha para compararlos de un vistazo */}
                        <span className={`flex items-center gap-1.5 ${numericCols.has(header.id) ? "justify-end" : ""}`}>
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
                      <th key={header.id} className="px-2 py-2 align-top border-b border-gray-200 dark:border-gray-700">
                        <ColumnFilter column={header.column} dates={datesByColumn[header.id]} />
                      </th>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={visibleIdx.length || 1} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t("No rows match the current search or filters.")}
                    </td>
                  </tr>
                )}
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                    {row.getVisibleCells().map((cell) => {
                      const isNumeric = numericCols.has(cell.column.id);
                      const val = cell.getValue();
                      const heatClass = heatmap && isNumeric && val !== "" && val !== null
                        ? getHeatClass(val, colRanges[cell.column.id], columnTypes[cell.column.id]?.decimal)
                        : "";
                      return (
                        <td
                          key={cell.id}
                          className={`px-4 py-2 whitespace-nowrap font-medium transition-colors ${
                            heatClass || "text-gray-700 dark:text-gray-300"
                          } ${isNumeric ? "text-right tabular-nums" : ""}`}
                        >
                          {editable
                            ? <EditableCell cell={cell} table={table} alignRight={isNumeric} />
                            : flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="font-medium">{t("Rows per page:")}</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {[10, 15, 25, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="text-xs font-medium">
              {t("Page")} <strong className="text-gray-900 dark:text-white">{fmtNumber(pageIndex + 1)}</strong> {t("of")}{" "}
              <strong className="text-gray-900 dark:text-white">{fmtNumber(pageCount || 1)}</strong>
              {" "}· {tn("{count} row", "{count} rows", table.getFilteredRowModel().rows.length)}
            </span>
            <div className="flex items-center gap-1">
              {[
                { icon: faAnglesLeft,   label: t("First page"),    action: () => table.setPageIndex(0),           disabled: !canPreviousPage },
                { icon: faChevronLeft,  label: t("Previous page"), action: () => table.previousPage(),             disabled: !canPreviousPage },
                { icon: faChevronRight, label: t("Next page"),     action: () => table.nextPage(),                 disabled: !canNextPage },
                { icon: faAnglesRight,  label: t("Last page"),     action: () => table.setPageIndex(pageCount-1), disabled: !canNextPage },
              ].map(({ icon, label, action, disabled }) => (
                <button key={label} onClick={action} disabled={disabled} aria-label={label}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FontAwesomeIcon icon={icon} className="text-xs" />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t("No data to display.")}
          </p>
        </div>
      )}
    </div>
  );
}

export default CommonTable;
