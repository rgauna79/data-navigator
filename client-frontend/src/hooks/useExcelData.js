import { useState } from "react";
import { EXCEL_SESSION_KEY, useExcelContext } from "../context/ExcelContext";
import { analyzeColumns, hasUsableData } from "../utils/excelUtils.js";
import { parseSheet, findBestSheet, readWorkbook } from "../utils/sheetParser.js";
import { saveSession, updateSession } from "../utils/sessionStore.js";

export const useExcelData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    workbook,
    setWorkbook,
    setFileInfo,
    setSelectedSheet,
    setFileData,
    setColumnAnalysis,
    setLoadError,
    markFileOpened,
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
    updateSession(EXCEL_SESSION_KEY, { selectedSheet: sheetName });
    return hasData;
  };

  const handleFileChange = (file) => {
    setIsLoading(true);
    setLoadError(null);
    markFileOpened();
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = readWorkbook(e.target.result);
        setWorkbook(wb);
        setFileInfo({ name: file.name, size: file.size });

        const bestSheet = findBestSheet(wb);
        if (!bestSheet) {
          setSelectedSheet("");
          setFileData([]);
          setColumnAnalysis([]);
          setLoadError("This file does not contain any sheets.");
          return;
        }

        // Se guarda el archivo original para recuperarlo tras recargar la página
        await saveSession(EXCEL_SESSION_KEY, {
          file,
          name: file.name,
          size: file.size,
          selectedSheet: bestSheet,
        });

        // Si ninguna hoja tiene datos, se selecciona igualmente la primera
        // para mostrar el dropdown y el aviso de hoja vacía.
        loadSheet(bestSheet, wb);
      } catch (error) {
        console.error("Error reading file:", error);
        setFileInfo(null);
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
