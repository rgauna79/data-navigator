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

// Ordena por valor numérico ("1,200" > "950"); vacíos al final.
// Ordenar compara cada valor muchas veces, así que la conversión a número se
// guarda en caché (una por tabla, se descarta al cambiar los datos).
const createNumericSort = () => {
  const cache = new Map();
  const numberOf = (value) => {
    let n = cache.get(value);
    if (n === undefined) {
      n = toNumber(value);
      cache.set(value, n);
    }
    return n;
  };
  return (a, b, columnId) => {
    const x = numberOf(a.getValue(columnId));
    const y = numberOf(b.getValue(columnId));
    if (isNaN(x)) return isNaN(y) ? 0 : 1;
    if (isNaN(y)) return -1;
    return x - y;
  };
};

// rows: matriz de la hoja (primera fila = encabezados)
// columnTypes: tipos ya resueltos (con correcciones del usuario); si no se
// pasan, se detectan automáticamente
// normalized: las filas ya vienen recortadas y con el mismo ancho (las del
// lector); evita recorrer otra vez hojas grandes
function DataTable({
  rows, columnTypes: typesProp, normalized = false, sheetName, showSaveButton = false, handleCloseTable,
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const fileData = useMemo(
    () => (normalized ? rows || [] : normalizeRows(formatJson(rows || []))),
    [rows, normalized]
  );
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

  // eslint-disable-next-line react-hooks/exhaustive-deps -- nueva caché cuando cambian los datos
  const numericSort = useMemo(() => createNumericSort(), [data]);

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
    [headers, numericCols, columnMeta, numericSort]
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
