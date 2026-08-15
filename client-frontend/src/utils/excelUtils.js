import * as XLSX from "xlsx";

export const formatJson = (json) =>
  json.map((row) =>
    row.map((cell) =>
      typeof cell === "string" ? cell.trim().toUpperCase() : cell
    )
  );

export const parseSheet = (workbook, sheetName) => {
  if (!workbook || !workbook.Sheets[sheetName]) return [];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  return formatJson(json);
};

export const hasUsableData = (formatted) =>
  formatted
    .slice(1)
    .some((row) => Object.values(row).some((cell) => cell !== ""));

export const isHiddenSheet = (workbook, sheetName) => {
  const meta = workbook?.Workbook?.Sheets?.find((s) => s.name === sheetName);
  return Boolean(meta && meta.Hidden > 0);
};

// Detecta si una columna es numérica (>60% de valores son números)
export const isNumericColumn = (values) => {
  const nonEmpty = values.filter((v) => v !== null && v !== "");
  if (nonEmpty.length === 0) return false;
  const numeric = nonEmpty.filter((v) => !isNaN(parseFloat(v)) && isFinite(v));
  return numeric.length / nonEmpty.length > 0.6;
};

// Detecta si una columna es de fecha
export const isDateColumn = (values) => {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== "" && typeof v === "string"
  );
  if (nonEmpty.length === 0) return false;
  const dates = nonEmpty.filter((v) => !isNaN(new Date(v).getTime()));
  return dates.length / nonEmpty.length > 0.6;
};

// Analiza todas las columnas del sheet y genera un resumen automático
export const analyzeColumns = (fileData) => {
  if (!fileData || fileData.length < 2) return [];

  const headers = fileData[0];
  const rows = fileData.slice(1).filter((row) =>
    Object.values(row).some((cell) => cell !== "")
  );

  return headers.map((header, colIndex) => {
    const values = rows.map((row) => row[colIndex]);
    const nonEmpty = values.filter((v) => v !== null && v !== "");
    const uniqueValues = [...new Set(nonEmpty)];

    if (isNumericColumn(values)) {
      const nums = nonEmpty.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
      return {
        name: header,
        type: "numeric",
        count: nonEmpty.length,
        unique: uniqueValues.length,
        min: Math.min(...nums),
        max: Math.max(...nums),
        avg: nums.reduce((a, b) => a + b, 0) / nums.length,
        sum: nums.reduce((a, b) => a + b, 0),
      };
    }

    if (isDateColumn(values)) {
      const dates = nonEmpty
        .map((v) => new Date(v))
        .filter((d) => !isNaN(d))
        .sort((a, b) => a - b);
      return {
        name: header,
        type: "date",
        count: nonEmpty.length,
        unique: uniqueValues.length,
        min: dates[0],
        max: dates[dates.length - 1],
      };
    }

    // Categórica: top 5 valores más frecuentes
    const freq = {};
    nonEmpty.forEach((v) => {
      freq[v] = (freq[v] || 0) + 1;
    });
    const topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      name: header,
      type: "categorical",
      count: nonEmpty.length,
      unique: uniqueValues.length,
      topValues,
    };
  });
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
