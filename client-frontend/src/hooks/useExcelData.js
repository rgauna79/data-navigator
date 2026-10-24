import { EXCEL_SESSION_KEY, useExcelContext } from "../context/ExcelContext";
import { tk } from "../i18n/I18nContext.jsx";
import { hasUsableData } from "../utils/excelUtils.js";
import { loadSheetRows, openSheetFile } from "../utils/sheetClient.js";
import { saveSession, updateSession } from "../utils/sessionStore.js";

export const useExcelData = () => {
  const {
    isLoadingFile: isLoading,
    setIsLoadingFile: setIsLoading,
    setSheetNames,
    setFileInfo,
    setSelectedSheet,
    setFileData,
    setLoadError,
    markFileOpened,
    resetColumnOverrides,
  } = useExcelContext();

  const showSheet = (sheetName, rows) => {
    setSelectedSheet(sheetName);
    setFileData(rows);
    // Una hoja sin datos no es un error: FileReaderPage muestra un aviso propio
    setLoadError(null);
  };

  // Carga otra hoja del archivo abierto (se procesa en el Web Worker).
  // Devuelve true si la hoja tiene datos utilizables.
  const loadSheet = async (sheetName) => {
    setIsLoading(true);
    try {
      const { rows } = await loadSheetRows(sheetName);
      showSheet(sheetName, rows);
      updateSession(EXCEL_SESSION_KEY, { selectedSheet: sheetName });
      return hasUsableData(rows);
    } catch (error) {
      setLoadError(error.message || tk("Could not load the sheet."));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (file) => {
    setIsLoading(true);
    setLoadError(null);
    markFileOpened();
    try {
      // La lectura del archivo ocurre en el Web Worker para no congelar la interfaz
      const { sheetNames, sheetName, rows } = await openSheetFile(await file.arrayBuffer(), file.name);
      setSheetNames(sheetNames);
      setFileInfo({ name: file.name, size: file.size });
      resetColumnOverrides();

      if (!sheetName) {
        setSelectedSheet("");
        setFileData([]);
        setLoadError(tk("This file does not contain any sheets."));
        return;
      }

      // Se guarda el archivo original para recuperarlo tras recargar la página
      await saveSession(EXCEL_SESSION_KEY, {
        file,
        name: file.name,
        size: file.size,
        selectedSheet: sheetName,
      });

      // Si ninguna hoja tiene datos, se muestra igualmente la primera
      // para que aparezca el selector de hojas y el aviso de hoja vacía.
      showSheet(sheetName, rows);
    } catch (error) {
      console.error("Error reading file:", error);
      setSheetNames([]);
      setFileInfo(null);
      setSelectedSheet("");
      setFileData([]);
      setLoadError(tk("Could not read the file. Make sure it is a valid spreadsheet or CSV file."));
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleFileChange, loadSheet };
};
