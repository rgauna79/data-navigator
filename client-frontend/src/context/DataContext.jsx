// context/DataContext.jsx
// ✅ Capa de compatibilidad: re-exporta ExcelContext + ReportContext
// Esto permite migrar gradualmente sin romper componentes que ya usen useDataContext
import { useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { ExcelProvider, useExcelContext } from "./ExcelContext.jsx";
import { ReportProvider, useReportContext } from "./ReportContext.jsx";

// Hook de compatibilidad: une los dos contextos en uno
// Los componentes existentes que usen useDataContext() siguen funcionando sin cambios
export const useDataContext = () => {
  const excel = useExcelContext();
  const report = useReportContext();
  return { ...excel, ...report };
};

// Borra el archivo y el informe (también la copia en el navegador) cuando el
// usuario cierra sesión o cambia de cuenta, para no dejar datos en equipos
// compartidos. Iniciar sesión tras abrir un archivo sin cuenta lo conserva.
function ResetOnUserChange() {
  const { user, isLoading } = useAuth();
  const { resetExcel } = useExcelContext();
  const { resetReport } = useReportContext();
  const previousUserId = useRef(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (isLoading) return;
    if (previousUserId.current && previousUserId.current !== userId) {
      resetExcel();
      resetReport();
    }
    previousUserId.current = userId;
  }, [userId, isLoading, resetExcel, resetReport]);

  return null;
}

// Provider combinado que envuelve ambos providers
export const DataProvider = ({ children }) => {
  return (
    <ExcelProvider>
      <ReportProvider>
        <ResetOnUserChange />
        {children}
      </ReportProvider>
    </ExcelProvider>
  );
};

export default DataProvider;
