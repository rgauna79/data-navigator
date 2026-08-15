import { useState } from "react";
import * as XLSX from "xlsx";
import { useExcelContext } from "../context/ExcelContext";
import { parseSheet, findBestSheet } from "../utils/excelUtils.js";

export const useExcelData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    setWorkbook,
    setSelectedSheet,
    setFileData,
    setColumnAnalysis,
    setLoadError,
    loadSheet,
  } = useExcelContext();

  const handleFileChange = (file) => {
    setIsLoading(true);
    setLoadError(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        setWorkbook(wb);

        const bestSheet = findBestSheet(wb);
        if (!bestSheet) {
          setSelectedSheet("");
          setFileData([]);
          setColumnAnalysis([]);
          setLoadError("Este archivo no contiene hojas.");
          return;
        }

        // Si la hoja elegida tiene datos utilizables, se carga normalmente.
        // Si no, se selecciona igualmente (para mostrar el dropdown) pero
        // se informa que no tiene datos.
        const hasData = loadSheet(bestSheet, wb);
        if (!hasData) {
          const formatted = parseSheet(wb, bestSheet);
          setFileData(formatted);
          setColumnAnalysis([]);
          setLoadError("La hoja seleccionada no contiene datos.");
        }
      } catch (error) {
        console.error("Error reading file:", error);
        setSelectedSheet("");
        setFileData([]);
        setColumnAnalysis([]);
        setLoadError("No se pudo leer el archivo. Verifica que sea un Excel válido.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return { isLoading, handleFileChange };
};
