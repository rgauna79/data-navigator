// Formatos de archivo admitidos. Módulo aparte de sheetParser.js para que
// validar un archivo no cargue la librería xlsx en la página.
export const SUPPORTED_EXTENSIONS = [".xlsx", ".xlsm", ".xls", ".ods", ".csv", ".tsv", ".txt"];
export const TEXT_EXTENSIONS = [".csv", ".tsv", ".txt"];

export const extensionOf = (fileName = "") => {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
};

export const isSupportedFile = (fileName) => SUPPORTED_EXTENSIONS.includes(extensionOf(fileName));
