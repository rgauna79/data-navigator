import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import CommonTable from "./CommonTable.jsx";
import * as XLSX from "xlsx";

function DataTable({ workbook, selectedSheet, isLoggedIn, sheetSaved }) {
  const [fileData, setFileData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const formatJson = (json) => {
    return json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );
  };

  useEffect(() => {
    if (sheetSaved) {
      setFileData(formatJson(sheetSaved));
      return;
    }
    if (!workbook || !selectedSheet) return;
    const sheet = workbook.Sheets[selectedSheet];
    const json = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 });
    setFileData(formatJson(json));
  }, [workbook, selectedSheet, sheetSaved]);

  // ✅ TanStack v8: column defs usan `header` y `accessorKey`
  const columns = useMemo(() => {
    if (!fileData || fileData.length === 0) return [];
    return Object.keys(fileData[0]).map((col) => ({
      id: col,
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
      isLoggedIn={isLoggedIn}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
    />
  );
}

export default DataTable;