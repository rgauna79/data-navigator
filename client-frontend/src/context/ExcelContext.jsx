import { createContext, useContext, useState } from "react";

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

  // La carga de hojas (loadSheet) vive en hooks/useExcelData.js para que la
  // librería xlsx no forme parte del bundle principal.

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
      resetExcel,
    }}>
      {children}
    </ExcelContext.Provider>
  );
};
