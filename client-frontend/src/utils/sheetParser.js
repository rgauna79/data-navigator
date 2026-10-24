import * as XLSX from "xlsx";
import { formatJson, hasUsableData, normalizeRows } from "./excelUtils.js";

import { TEXT_EXTENSIONS, extensionOf } from "./fileTypes.js";

// Se reexportan para quien ya las importaba desde aquí
export { SUPPORTED_EXTENSIONS, isSupportedFile } from "./fileTypes.js";

// Decodifica un CSV: UTF-8 (con o sin BOM) y, si no es UTF-8 válido,
// Windows-1252, que es lo que exporta Excel en Windows como "CSV".
const decodeText = (arrayBuffer) => {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(arrayBuffer);
  } catch {
    return new TextDecoder("windows-1252").decode(arrayBuffer);
  }
};

// Nombre de hoja a partir del nombre del archivo ("ventas.csv" -> "ventas").
// Excel limita los nombres de hoja a 31 caracteres.
const sheetNameFromFile = (fileName) =>
  (fileName.replace(/\.[^.]+$/, "").replace(/[\\/?*[\]:]/g, " ").trim() || "Sheet1").slice(0, 31);

export const readWorkbook = (arrayBuffer, fileName = "") => {
  if (!TEXT_EXTENSIONS.includes(extensionOf(fileName))) {
    return XLSX.read(arrayBuffer, { type: "array" });
  }
  // raw: true mantiene todo como texto: no se pierden ceros a la izquierda
  // ("00123") ni se reinterpretan fechas; los cálculos usan toNumber/parseDate.
  const wb = XLSX.read(decodeText(arrayBuffer), { type: "string", raw: true });
  const name = sheetNameFromFile(fileName);
  const [original] = wb.SheetNames;
  if (name !== original) {
    wb.Sheets[name] = wb.Sheets[original];
    delete wb.Sheets[original];
    wb.SheetNames = [name];
  }
  return wb;
};

export const parseSheet = (workbook, sheetName) => {
  if (!workbook || !workbook.Sheets[sheetName]) return [];
  const sheet = workbook.Sheets[sheetName];
  // raw: false devuelve el texto tal como se ve en Excel ("1,234.50", "$2,000").
  // Los cálculos convierten ese texto con toNumber().
  const json = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });
  return normalizeRows(formatJson(json));
};

export const isHiddenSheet = (workbook, sheetName) => {
  const meta = workbook?.Workbook?.Sheets?.find((s) => s.name === sheetName);
  return Boolean(meta && meta.Hidden > 0);
};

// Primera hoja a mostrar al abrir un archivo, ya procesada (cada hoja se
// procesa una sola vez). Usa preferredSheet si existe; si no, la primera hoja
// visible con datos; si ninguna tiene datos, la primera visible.
// Devuelve { sheetName, rows } o null si el archivo no tiene hojas.
export const openFirstSheet = (workbook, preferredSheet) => {
  if (!workbook?.SheetNames?.length) return null;
  if (preferredSheet && workbook.Sheets[preferredSheet]) {
    return { sheetName: preferredSheet, rows: parseSheet(workbook, preferredSheet) };
  }
  const visibleSheets = workbook.SheetNames.filter((name) => !isHiddenSheet(workbook, name));
  let firstVisible = null;
  for (const name of visibleSheets) {
    const rows = parseSheet(workbook, name);
    if (hasUsableData(rows)) return { sheetName: name, rows };
    firstVisible ??= { sheetName: name, rows };
  }
  const fallback = visibleSheets.length ? null : workbook.SheetNames[0];
  return firstVisible || { sheetName: fallback, rows: parseSheet(workbook, fallback) };
};

// Descarga una matriz como archivo .xlsx (primera fila = encabezados)
export const downloadXlsx = (fileName, sheetName, rows) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetNameFromFile(sheetName || "Data"));
  XLSX.writeFile(wb, fileName);
};
