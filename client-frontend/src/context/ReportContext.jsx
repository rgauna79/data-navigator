// context/ReportContext.jsx
// ✅ Maneja el informe actual y sus opciones de configuración.
// El último informe se guarda en IndexedDB para que sobreviva a una recarga.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { clearSession, loadSession, saveSession } from "../utils/sessionStore.js";

const ReportContext = createContext();

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context) throw new Error("useReportContext must be used within ReportProvider");
  return context;
};

const SESSION_KEY = "report";

export const ReportProvider = ({ children }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [typeReport, setTypeReport] = useState("");
  const [data, setData] = useState([]);
  // Encabezados de la hoja del informe (índice -> nombre)
  const [headers, setHeaders] = useState([]);
  // Configuración del informe "group": agrupación, métrica, etc.
  const [config, setConfig] = useState(null);
  const [isRestoringReport, setIsRestoringReport] = useState(true);
  const restored = useRef(false);

  // Recupera el último informe al cargar la app
  useEffect(() => {
    loadSession(SESSION_KEY).then((saved) => {
      // Si ya se generó un informe nuevo mientras se leía, no se pisa
      if (saved && !restored.current) {
        setSelectedOptions(saved.selectedOptions);
        setTypeReport(saved.typeReport);
        setData(saved.data);
        setHeaders(saved.headers);
        setConfig(saved.config ?? null);
      }
      restored.current = true;
      setIsRestoringReport(false);
    });
  }, []);

  // Genera un informe nuevo y lo persiste
  const setReport = useCallback((report) => {
    restored.current = true;
    setSelectedOptions(report.selectedOptions);
    setTypeReport(report.typeReport);
    setData(report.data);
    setHeaders(report.headers);
    setConfig(report.config ?? null);
    saveSession(SESSION_KEY, report);
  }, []);

  const resetReport = useCallback(() => {
    setSelectedOptions({});
    setTypeReport("");
    setData([]);
    setHeaders([]);
    setConfig(null);
    clearSession(SESSION_KEY);
  }, []);

  return (
    <ReportContext.Provider
      value={{
        selectedOptions,
        typeReport,
        data,
        headers,
        config,
        isRestoringReport,
        setReport,
        resetReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};
