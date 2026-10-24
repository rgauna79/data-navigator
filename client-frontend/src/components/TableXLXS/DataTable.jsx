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
  normalizeRows,
  resolveColumnTypes,
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
// columnTypes: tipos ya resueltos (con correcciones del usuario); si no se
// pasan, se detectan automáticamente
function DataTable({ rows, columnTypes: typesProp, sheetName, showSaveButton = false, handleCloseTable }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const fileData = useMemo(() => normalizeRows(formatJson(rows || [])), [rows]);
  const headers = useMemo(() => getHeaders(fileData), [fileData]);

  const data = useMemo(() => dataRows(fileData), [fileData]);

  // Tipo de cada columna (numeric | date | text) para ordenar, filtrar y el mapa de calor
  const columnMeta = useMemo(
    () => typesProp || resolveColumnTypes(fileData),
    [typesProp, fileData]
  );

  // Índices de columnas numéricas (como string, igual que el id de columna)
  const numericCols = useMemo(
    () => new Set(columnMeta.map((t, i) => (t.type === "numeric" ? String(i) : null)).filter(Boolean)),
    [columnMeta]
  );

  // ✅ TanStack v8: column defs usan `header` y `accessorFn`
  const columns = useMemo(
    () =>
      headers.map((header, i) => ({
        id: String(i),
        header,
        accessorFn: (row) => row[i],
        sortingFn: numericCols.has(String(i)) ? numericSort : "alphanumeric",
        filterFn: FILTERS[columnMeta[i]?.type || "text"],
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
      columnTypes={columnMeta}
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
