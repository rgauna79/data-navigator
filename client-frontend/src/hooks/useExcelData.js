import { useState } from "react";
import * as XLSX from "xlsx";
import { useExcelContext } from "../context/ExcelContext";

// Detecta si una columna es numérica (>60% de valores son números)
const isNumericColumn = (values) => {
  const nonEmpty = values.filter((v) => v !== null && v !== "");
  if (nonEmpty.length === 0) return false;
  const numeric = nonEmpty.filter((v) => !isNaN(parseFloat(v)) && isFinite(v));
  return numeric.length / nonEmpty.length > 0.6;
};

// Detecta si una columna es de fecha
const isDateColumn = (values) => {
  const nonEmpty = values.filter((v) => v !== null && v !== "" && typeof v === "string");
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
    nonEmpty.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
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

export const useExcelData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { setFileData, setWorkbook, setSelectedSheet, setColumnAnalysis } =
    useExcelContext();

  const formatJson = (json) =>
    json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );

  const handleFileChange = (file) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        setWorkbook(wb);
        const sheetNames = wb.SheetNames;
        setSelectedSheet(sheetNames[0]);
        const sheet = wb.Sheets[sheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        const formatted = formatJson(json);
        setFileData(formatted);
        // ✅ Análisis automático al cargar
        if (setColumnAnalysis) {
          setColumnAnalysis(analyzeColumns(formatted));
        }
      } catch (error) {
        console.error("Error reading file:", error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return { isLoading, handleFileChange };
};