import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import CommonTable from "./CommonTable.jsx";

// ✅ Componente separado para ver sheets guardadas de la DB
// No usa workbook ni selectedSheet del contexto — recibe los datos directamente
function SavedDataTable({ sheetData }) {
  const [globalFilter, setGlobalFilter] = useState("");

  const formatJson = (json) => {
    if (!json || json.length === 0) return [];
    return json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );
  };

  const fileData = useMemo(() => formatJson(sheetData), [sheetData]);

  const columns = useMemo(() => {
    if (!fileData || fileData.length === 0) return [];
    return Object.keys(fileData[0]).map((col) => ({
      id: String(col),
      header: String(fileData[0][col] ?? col),
      accessorKey: col,
    }));
  }, [fileData]);

  const data = useMemo(() => {
    if (!fileData || fileData.length === 0) return [];
    return fileData
      .slice(1)
      .filter((row) => Object.values(row).some((cell) => cell !== ""));
  }, [fileData]);

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
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      showSaveButton={false}
    />
  );
}

export default SavedDataTable;
