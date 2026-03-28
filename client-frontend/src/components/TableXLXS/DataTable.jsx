import React, { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import CommonTable from "./CommonTable.jsx";
import { useDataContext } from "../../context/DataContext.jsx";
import * as XLSX from "xlsx";

function DataTable({ isLoggedIn, handleSaveTrigger, showSaveButton }) {
  const { workbook, selectedSheet, fileData, setFileData } = useDataContext();
  const [globalFilter, setGlobalFilter] = useState("");

  // ✅ Estado para guardar el historial de cambios
  const [history, setHistory] = useState([]);

  const formatJson = (json) => {
    return json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );
  };

  useEffect(() => {
    if (!workbook || !selectedSheet) return;
    const sheet = workbook.Sheets[selectedSheet];
    const json = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 });
    setFileData(formatJson(json));
    setHistory([]); // ✅ Limpiamos el historial al cambiar de hoja
  }, [workbook, selectedSheet]);

  // ✅ Función para actualizar que ahora recibe el valor viejo
  const updateData = (rowIndex, columnId, value, oldValue) => {
    // 1. Guardamos la acción en el historial ANTES de cambiarla
    setHistory((prev) => [...prev, { rowIndex, columnId, oldValue }]);

    // 2. Aplicamos el cambio
    setFileData((old) =>
      old.map((row, index) => {
        if (index === rowIndex + 1) {
          const newRow = [...row];
          newRow[columnId] = value.toUpperCase();
          return newRow;
        }
        return row;
      })
    );
  };

  // ✅ Función para Deshacer
  const undoLastChange = () => {
    setHistory((prev) => {
      const newHistory = [...prev];
      const lastAction = newHistory.pop(); // Sacamos el último cambio

      if (!lastAction) return prev;

      // Revertimos el cambio en los datos
      setFileData((old) =>
        old.map((row, index) => {
          if (index === lastAction.rowIndex + 1) {
            const newRow = [...row];
            newRow[lastAction.columnId] = lastAction.oldValue;
            return newRow;
          }
          return row;
        })
      );

      return newHistory; // Guardamos el historial actualizado
    });
  };

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
    meta: {
      updateData,
    },
  });

  return (
    <CommonTable
      table={table}
      data={data}
      isLoggedIn={isLoggedIn}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      showSaveButton={showSaveButton}
      handleSaveTrigger={handleSaveTrigger}
      canUndo={history.length > 0} // ✅ Pasamos si hay historial
      onUndo={undoLastChange} // ✅ Pasamos la función de deshacer
    />
  );
}

export default DataTable;
