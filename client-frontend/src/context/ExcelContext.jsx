import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { analyzeColumns, hasUsableData } from "../utils/excelUtils.js";
import { clearSession, loadSession } from "../utils/sessionStore.js";

const ExcelContext = createContext();

export const useExcelContext = () => {
  const context = useContext(ExcelContext);
  if (!context) throw new Error("useExcelContext must be used within ExcelProvider");
  return context;
};

export const EXCEL_SESSION_KEY = "excel";

export const ExcelProvider = ({ children }) => {
  const [workbook, setWorkbook] = useState(null);
  // Nombre y tamaño del archivo abierto
  const [fileInfo, setFileInfo] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [fileData, setFileData] = useState([]);
  const [columnAnalysis, setColumnAnalysis] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [isRestoringFile, setIsRestoringFile] = useState(true);
  // Se marca cuando el usuario abre un archivo, para no pisarlo con la restauración
  const fileOpened = useRef(false);

  // La carga de hojas (loadSheet) vive en hooks/useExcelData.js para que la
  // librería xlsx no forme parte del bundle principal.

  // Recupera el último archivo abierto. xlsx se importa dinámicamente para
  // que solo se descargue si hay algo que restaurar.
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSession(EXCEL_SESSION_KEY);
        if (!saved || fileOpened.current) return;
        const { readWorkbook, parseSheet } = await import("../utils/sheetParser.js");
        const wb = readWorkbook(await saved.file.arrayBuffer());
        if (fileOpened.current) return;
        const sheet = wb.Sheets[saved.selectedSheet] ? saved.selectedSheet : wb.SheetNames[0];
        const formatted = parseSheet(wb, sheet);
        setWorkbook(wb);
        setFileInfo({ name: saved.name, size: saved.size });
        setSelectedSheet(sheet);
        setFileData(formatted);
        setColumnAnalysis(hasUsableData(formatted) ? analyzeColumns(formatted) : []);
      } catch (error) {
        // Un archivo guardado ilegible no debe romper la app
        console.error("Could not restore the last file:", error);
        clearSession(EXCEL_SESSION_KEY);
      } finally {
        setIsRestoringFile(false);
      }
    })();
  }, []);

  const markFileOpened = useCallback(() => {
    fileOpened.current = true;
  }, []);

  const resetExcel = useCallback(() => {
    setWorkbook(null);
    setFileInfo(null);
    setSelectedSheet("");
    setFileData([]);
    setColumnAnalysis([]);
    setLoadError(null);
    clearSession(EXCEL_SESSION_KEY);
  }, []);

  return (
    <ExcelContext.Provider value={{
      workbook, setWorkbook,
      fileInfo, setFileInfo,
      selectedSheet, setSelectedSheet,
      fileData, setFileData,
      columnAnalysis, setColumnAnalysis,
      loadError, setLoadError,
      isRestoringFile,
      markFileOpened,
      resetExcel,
    }}>
      {children}
    </ExcelContext.Provider>
  );
};
