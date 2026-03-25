// context/DataContext.jsx
// ✅ Capa de compatibilidad: re-exporta ExcelContext + ReportContext
// Esto permite migrar gradualmente sin romper componentes que ya usen useDataContext
import React from "react";
import { ExcelProvider, useExcelContext } from "./ExcelContext.jsx";
import { ReportProvider, useReportContext } from "./ReportContext.jsx";

// Hook de compatibilidad: une los dos contextos en uno
// Los componentes existentes que usen useDataContext() siguen funcionando sin cambios
export const useDataContext = () => {
  const excel = useExcelContext();
  const report = useReportContext();
  return { ...excel, ...report };
};

// Provider combinado que envuelve ambos providers
export const DataProvider = ({ children }) => {
  return (
    <ExcelProvider>
      <ReportProvider>{children}</ReportProvider>
    </ExcelProvider>
  );
};

export default DataProvider;