import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { analyzeColumns, hasUsableData, resolveColumnTypes } from "../utils/excelUtils.js";
import { clearSession, loadSession, updateSession } from "../utils/sessionStore.js";

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
  // Correcciones manuales del tipo de columna, por hoja:
  // { [nombre de hoja]: { [índice]: { type?, dateOrder? } } }
  const [overridesBySheet, setOverridesBySheet] = useState({});
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
        const wb = readWorkbook(await saved.file.arrayBuffer(), saved.name);
        if (fileOpened.current) return;
        const sheet = wb.Sheets[saved.selectedSheet] ? saved.selectedSheet : wb.SheetNames[0];
        const formatted = parseSheet(wb, sheet);
        setWorkbook(wb);
        setFileInfo({ name: saved.name, size: saved.size });
        setSelectedSheet(sheet);
        setFileData(formatted);
        setOverridesBySheet(saved.overrides || {});
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
    setOverridesBySheet({});
    setLoadError(null);
    clearSession(EXCEL_SESSION_KEY);
  }, []);

  // Tipo final de cada columna (detectado + correcciones) y su resumen.
  // Es la única fuente de verdad para la tabla, los filtros y los informes.
  const columnOverrides = useMemo(
    () => overridesBySheet[selectedSheet] || {},
    [overridesBySheet, selectedSheet]
  );
  const columnTypes = useMemo(
    () => resolveColumnTypes(fileData, columnOverrides),
    [fileData, columnOverrides]
  );
  const columnAnalysis = useMemo(
    () => (hasUsableData(fileData) ? analyzeColumns(fileData, columnTypes) : []),
    [fileData, columnTypes]
  );

  // Cambia el tipo u orden de fechas de una columna de la hoja actual.
  // change: { type?, dateOrder? }; un valor vacío vuelve a la detección automática.
  const setColumnOverride = useCallback(
    (index, change) => {
      setOverridesBySheet((prev) => {
        const sheetOverrides = { ...(prev[selectedSheet] || {}) };
        const merged = { ...sheetOverrides[index], ...change };
        Object.keys(merged).forEach((k) => !merged[k] && delete merged[k]);
        if (Object.keys(merged).length) sheetOverrides[index] = merged;
        else delete sheetOverrides[index];
        return { ...prev, [selectedSheet]: sheetOverrides };
      });
    },
    [selectedSheet]
  );

  // Guarda las correcciones junto al archivo para recuperarlas tras recargar
  useEffect(() => {
    updateSession(EXCEL_SESSION_KEY, { overrides: overridesBySheet });
  }, [overridesBySheet]);

  // Al abrir otro archivo se descartan las correcciones del anterior
  const resetColumnOverrides = useCallback(() => setOverridesBySheet({}), []);

  return (
    <ExcelContext.Provider value={{
      workbook, setWorkbook,
      fileInfo, setFileInfo,
      selectedSheet, setSelectedSheet,
      fileData, setFileData,
      columnTypes, columnAnalysis, columnOverrides,
      setColumnOverride, resetColumnOverrides,
      loadError, setLoadError,
      isRestoringFile,
      markFileOpened,
      resetExcel,
    }}>
      {children}
    </ExcelContext.Provider>
  );
};
