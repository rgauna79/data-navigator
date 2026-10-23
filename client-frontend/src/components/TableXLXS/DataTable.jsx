import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import CommonTable from "./CommonTable.jsx";
import {
  dataRows,
  formatJson,
  getHeaders,
  inferDateOrder,
  isDateColumn,
  isNumericColumn,
  normalizeRows,
  toNumber,
} from "../../utils/excelUtils.js";
import { dateRangeFilter, numberRangeFilter, textFilter } from "../../utils/tableFilters.js";

const FILTERS = { numeric: numberRangeFilter, date: dateRangeFilter, text: textFilter };

// Ordena por valor numérico ("1,200" > "950"); vacíos al final
const numericSort = (a, b, columnId) => {
  const x = toNumber(a.getValue(columnId));
  const y = toNumber(b.getValue(columnId));
  if (isNaN(x)) return isNaN(y) ? 0 : 1;
  if (isNaN(y)) return -1;
  return x - y;
};

// rows: matriz de la hoja (primera fila = encabezados)
function DataTable({ rows, sheetName, showSaveButton = false, handleCloseTable }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const fileData = useMemo(() => normalizeRows(formatJson(rows || [])), [rows]);
  const headers = useMemo(() => getHeaders(fileData), [fileData]);

  const data = useMemo(() => dataRows(fileData), [fileData]);

  // Índices de columnas numéricas (como string, igual que el id de columna)
  const numericCols = useMemo(
    () =>
      new Set(
        headers
          .map((_, i) => i)
          .filter((i) => isNumericColumn(data.map((row) => row[i])))
          .map(String)
      ),
    [headers, data]
  );

  // Tipo de cada columna para elegir su filtro: numeric | date | text
  const columnMeta = useMemo(
    () =>
      headers.map((_, i) => {
        if (numericCols.has(String(i))) return { type: "numeric" };
        const values = data.map((row) => row[i]);
        return isDateColumn(values)
          ? { type: "date", dateOrder: inferDateOrder(values) }
          : { type: "text" };
      }),
    [headers, data, numericCols]
  );

  // ✅ TanStack v8: column defs usan `header` y `accessorFn`
  const columns = useMemo(
    () =>
      headers.map((header, i) => ({
        id: String(i),
        header,
        accessorFn: (row) => row[i],
        sortingFn: numericCols.has(String(i)) ? numericSort : "alphanumeric",
        filterFn: FILTERS[columnMeta[i].type],
        meta: columnMeta[i],
      })),
    [headers, numericCols, columnMeta]
  );

  // ✅ TanStack v8: useReactTable con model getters
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <CommonTable
      table={table}
      data={data}
      headers={headers}
      numericCols={numericCols}
      sheetName={sheetName}
      fileData={fileData}
      handleCloseTable={handleCloseTable}
      showSaveButton={showSaveButton}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
    />
  );
}

export default DataTable;
