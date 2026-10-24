import { openFirstSheet, parseSheet, readWorkbook } from "./sheetParser.js";

// Operaciones sobre el archivo abierto. Se ejecutan en un Web Worker
// (workers/sheet.worker.js) para no congelar la interfaz con archivos grandes,
// o en el hilo principal si el navegador no admite Workers.
// El workbook vive aquí; la interfaz solo recibe nombres de hoja y filas.
export const createSheetService = () => {
  let workbook = null;
  return {
    // Abre un archivo y devuelve sus hojas y la primera a mostrar
    open({ buffer, name, preferredSheet }) {
      workbook = readWorkbook(buffer, name);
      const first = openFirstSheet(workbook, preferredSheet);
      return {
        sheetNames: workbook.SheetNames,
        sheetName: first?.sheetName ?? null,
        rows: first?.rows ?? [],
      };
    },
    // Filas de otra hoja del archivo abierto
    sheet({ sheetName }) {
      if (!workbook?.Sheets[sheetName]) throw new Error("The selected sheet does not exist.");
      return { rows: parseSheet(workbook, sheetName) };
    },
    close() {
      workbook = null;
      return {};
    },
  };
};
