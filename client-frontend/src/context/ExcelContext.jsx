import React, { createContext, useContext, useState } from "react";
import { parseSheet, analyzeColumns } from "../utils/excelUtils.js";

const ExcelContext = createContext();

export const useExcelContext = () => {
  const context = useContext(ExcelContext);
  if (!context) throw new Error("useExcelContext must be used within ExcelProvider");
  return context;
};

export const ExcelProvider = ({ children }) => {
  const [workbook, setWorkbook] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [fileData, setFileData] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filter, setFilter] = useState({ input: "", column: "" });
  const [columnAnalysis, setColumnAnalysis] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // Carga una hoja concreta del workbook y actualiza el contexto.
  // wb es opcional: si no se pasa, usa el workbook del estado.
  // Devuelve true si la hoja tiene datos utilizables.
  const loadSheet = (sheetName, wb) => {
    const source = wb || workbook;
    if (!source || !source.Sheets[sheetName]) {
      setLoadError("La hoja seleccionada no existe.");
      return false;
    }
    const formatted = parseSheet(source, sheetName);
    setSelectedSheet(sheetName);
    setFileData(formatted);
    setColumnAnalysis(analyzeColumns(formatted));
    setLoadError(null);
    return formatted.length > 0;
  };

  const resetExcel = () => {
    setWorkbook(null);
    setSelectedSheet("");
    setFileData([]);
    setSelectedColumns([]);
    setFilter({ input: "", column: "" });
    setColumnAnalysis([]);
    setLoadError(null);
  };

  return (
    <ExcelContext.Provider value={{
      workbook, setWorkbook,
      selectedSheet, setSelectedSheet,
      fileData, setFileData,
      selectedColumns, setSelectedColumns,
      filter, setFilter,
      columnAnalysis, setColumnAnalysis,
      loadError, setLoadError,
      loadSheet,
      resetExcel,
    }}>
      {children}
    </ExcelContext.Provider>
  );
};
