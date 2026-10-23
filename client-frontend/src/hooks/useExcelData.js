import { useState } from "react";
import * as XLSX from "xlsx";
import { useExcelContext } from "../context/ExcelContext";
import { analyzeColumns, hasUsableData } from "../utils/excelUtils.js";
import { parseSheet, findBestSheet } from "../utils/sheetParser.js";

export const useExcelData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    workbook,
    setWorkbook,
    setSelectedSheet,
    setFileData,
    setColumnAnalysis,
    setLoadError,
  } = useExcelContext();

  // Carga una hoja concreta del workbook y actualiza el contexto.
  // wb es opcional: si no se pasa, usa el workbook del estado.
  // Devuelve true si la hoja tiene datos utilizables.
  const loadSheet = (sheetName, wb) => {
    const source = wb || workbook;
    if (!source || !source.Sheets[sheetName]) {
      setLoadError("The selected sheet does not exist.");
      return false;
    }
    const formatted = parseSheet(source, sheetName);
    const hasData = hasUsableData(formatted);
    setSelectedSheet(sheetName);
    setFileData(formatted);
    setColumnAnalysis(hasData ? analyzeColumns(formatted) : []);
    // Una hoja sin datos no es un error: FileReaderPage muestra un aviso propio
    setLoadError(null);
    return hasData;
  };

  const handleFileChange = (file) => {
    setIsLoading(true);
    setLoadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        setWorkbook(wb);

        const bestSheet = findBestSheet(wb);
        if (!bestSheet) {
          setSelectedSheet("");
          setFileData([]);
          setColumnAnalysis([]);
          setLoadError("This file does not contain any sheets.");
          return;
        }

        // Si ninguna hoja tiene datos, se selecciona igualmente la primera
        // para mostrar el dropdown y el aviso de hoja vacía.
        loadSheet(bestSheet, wb);
      } catch (error) {
        console.error("Error reading file:", error);
        setSelectedSheet("");
        setFileData([]);
        setColumnAnalysis([]);
        setLoadError("Could not read the file. Make sure it is a valid Excel file.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return { isLoading, handleFileChange, loadSheet };
};
