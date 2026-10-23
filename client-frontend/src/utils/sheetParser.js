import * as XLSX from "xlsx";
import { formatJson, hasUsableData, normalizeRows } from "./excelUtils.js";

// Formatos admitidos. SheetJS detecta el formato binario por el contenido;
// los de texto se tratan aparte para controlar la codificación.
export const SUPPORTED_EXTENSIONS = [".xlsx", ".xlsm", ".xls", ".ods", ".csv", ".tsv", ".txt"];
const TEXT_EXTENSIONS = [".csv", ".tsv", ".txt"];

const extensionOf = (fileName = "") => {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot).toLowerCase();
};

export const isSupportedFile = (fileName) => SUPPORTED_EXTENSIONS.includes(extensionOf(fileName));

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

// Devuelve la primera hoja no oculta con datos utilizables.
// Si ninguna tiene datos, devuelve la primera hoja no oculta (o null).
export const findBestSheet = (workbook) => {
  if (!workbook?.SheetNames?.length) return null;
  const visibleSheets = workbook.SheetNames.filter(
    (name) => !isHiddenSheet(workbook, name)
  );
  for (const name of visibleSheets) {
    if (hasUsableData(parseSheet(workbook, name))) return name;
  }
  return visibleSheets[0] || workbook.SheetNames[0] || null;
};
