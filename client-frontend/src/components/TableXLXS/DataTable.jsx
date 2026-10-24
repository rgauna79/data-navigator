import { useEffect, useMemo, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import CommonTable from "./CommonTable.jsx";
import { useExcelContext } from "../../context/ExcelContext.jsx";
import {
  dataRows,
  formatJson,
  getHeaders,
  normalizeRows,
  resolveColumnTypes,
} from "../../utils/excelUtils.js";
import { createSorter } from "../../utils/tableSorting.js";
import { dateRangeFilter, numberRangeFilter, textFilter } from "../../utils/tableFilters.js";

const FILTERS = { numeric: numberRangeFilter, date: dateRangeFilter, text: textFilter };

// rows: matriz de la hoja (primera fila = encabezados)
// columnTypes: tipos ya resueltos (con correcciones del usuario); si no se
// pasan, se detectan automáticamente
// normalized: las filas ya vienen recortadas y con el mismo ancho (las del
// lector); evita recorrer otra vez hojas grandes
// editable: las celdas se pueden editar con doble clic (solo la hoja abierta
// en el lector: las ediciones se guardan en ExcelContext y se pueden deshacer)
function DataTable({
  rows, columnTypes: typesProp, normalized = false, editable = false, sheetName, showSaveButton = false,
  handleCloseTable,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const { editCell, undoEdit, editCount } = useExcelContext();
  // Al editar una celda cambian los datos; no se vuelve a la primera página
  const skipPageReset = useRef(false);
  useEffect(() => {
    skipPageReset.current = false;
  });

  const fileData = useMemo(
    () => (normalized ? rows || [] : normalizeRows(formatJson(rows || []))),
    [rows, normalized]
  );
  const headers = useMemo(() => getHeaders(fileData), [fileData]);

  const data = useMemo(() => dataRows(fileData), [fileData]);

  // Posición de cada fila en la hoja (dataRows omite el encabezado y las filas vacías)
  const sheetRowIndex = useMemo(() => new Map(fileData.map((row, i) => [row, i])), [fileData]);

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

  // Orden según el tipo de cada columna, con los vacíos siempre al final.
  // La dirección del orden se lee de la tabla (se crea más abajo).
  const tableRef = useRef(null);
  const sorter = useMemo(
    () =>
      createSorter({
        typeOf: (id) => columnMeta[Number(id)],
        isDesc: (id) => Boolean(tableRef.current?.getState().sorting.find((s) => s.id === id)?.desc),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nueva caché cuando cambian los datos
    [data, columnMeta]
  );

  // ✅ TanStack v8: column defs usan `header` y `accessorFn`
  const columns = useMemo(
    () =>
      headers.map((header, i) => ({
        id: String(i),
        header,
        accessorFn: (row) => row[i],
        sortingFn: sorter,
        filterFn: FILTERS[columnMeta[i]?.type || "text"],
        meta: columnMeta[i],
      })),
    [headers, columnMeta, sorter]
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
    autoResetPageIndex: !skipPageReset.current,
    meta: editable
      ? {
          // row: fila original (row.original); col: índice de columna
          updateData: (row, col, value) => {
            const index = sheetRowIndex.get(row);
            if (index === undefined) return;
            skipPageReset.current = true;
            editCell(index, col, value);
          },
        }
      : undefined,
  });
  tableRef.current = table;

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
      editable={editable}
      canUndo={editable && editCount > 0}
      onUndo={undoEdit}
    />
  );
}

export default DataTable;
