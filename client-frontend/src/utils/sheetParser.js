import * as XLSX from "xlsx";
import { formatJson, hasUsableData, normalizeRows } from "./excelUtils.js";

export const readWorkbook = (arrayBuffer) =>
  XLSX.read(arrayBuffer, { type: "array" });

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
