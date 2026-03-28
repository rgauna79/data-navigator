import { useState } from "react";
import * as XLSX from "xlsx";
import { useExcelContext } from "../context/ExcelContext";

// --- UTILIDADES MATEMÁTICAS AVANZADAS ---

const getStandardDeviation = (array, mean) => {
  if (!array.length) return 0;
  const variance =
    array.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / array.length;
  return Math.sqrt(variance);
};

const getMedian = (array) => {
  if (!array.length) return 0;
  const sorted = [...array].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

const cleanNumericValue = (val) => {
  if (typeof val === "number") return val;
  if (!val || typeof val !== "string") return NaN;

  const clean = val.trim().replace(/[$\s,]/g, "");

  // Si la cadena contiene un "/" (ej. "3/5/26"), la descartamos como número
  if (clean.includes("/")) return NaN;

  return parseFloat(clean);
};

// --- DETECTORES ---

const isDateColumn = (values) => {
  const nonEmpty = values.filter((v) => v !== null && v !== "");
  if (nonEmpty.length === 0) return false;

  const dates = nonEmpty.filter((v) => {
    const strVal = String(v).trim();

    // Evitamos que números puros (ej. "300694") sean detectados como fechas erróneamente
    if (!isNaN(Number(strVal))) return false;

    if (strVal.length < 5) return false;
    const d = new Date(strVal);
    return (
      !isNaN(d.getTime()) && d.getFullYear() > 1900 && d.getFullYear() < 2100
    );
  });

  return dates.length / nonEmpty.length > 0.6;
};

const isNumericColumn = (values) => {
  const nonEmpty = values.filter((v) => v !== null && v !== "");
  if (nonEmpty.length === 0) return false;

  const numeric = nonEmpty.filter((v) => {
    const n = cleanNumericValue(v);
    return !isNaN(n) && isFinite(n);
  });

  return numeric.length / nonEmpty.length > 0.6;
};

// --- ANALIZADOR PRINCIPAL ---

export const analyzeColumns = (fileData) => {
  if (!fileData || fileData.length < 2) return [];

  const headers = fileData[0];
  const rows = fileData
    .slice(1)
    .filter((row) =>
      Object.values(row).some((cell) => cell !== "" && cell !== null)
    );

  return headers.map((header, colIndex) => {
    const values = rows.map((row) => row[colIndex]);
    const nonEmpty = values.filter(
      (v) => v !== null && v !== "" && v !== undefined
    );
    const uniqueValues = [...new Set(nonEmpty)];
    const fillRate = ((nonEmpty.length / rows.length) * 100).toFixed(1);

    if (isDateColumn(values)) {
      const dates = nonEmpty
        .map((v) => new Date(v))
        .filter((d) => !isNaN(d.getTime()))
        .sort((a, b) => a - b);

      return {
        name: header,
        type: "date",
        count: nonEmpty.length,
        fillRate,
        unique: uniqueValues.length,
        min: dates[0] || null,
        max: dates[dates.length - 1] || null,
      };
    }

    if (isNumericColumn(values)) {
      const nums = nonEmpty
        .map((v) => cleanNumericValue(v))
        .filter((v) => !isNaN(v));
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = nums.length > 0 ? sum / nums.length : 0;
      const stdDev = getStandardDeviation(nums, avg);
      const median = getMedian(nums);

      return {
        name: header,
        type: "numeric",
        count: nonEmpty.length,
        fillRate,
        unique: uniqueValues.length,
        min: nums.length ? Math.min(...nums) : 0,
        max: nums.length ? Math.max(...nums) : 0,
        avg,
        sum,
        median,
        stdDev,
        cv: avg !== 0 ? (stdDev / avg) * 100 : 0,
      };
    }

    const freq = {};
    nonEmpty.forEach((v) => {
      const val = String(v).trim();
      freq[val] = (freq[val] || 0) + 1;
    });
    const topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      name: header,
      type: "categorical",
      count: nonEmpty.length,
      fillRate,
      unique: uniqueValues.length,
      topValues,
    };
  });
};

export const useExcelData = () => {
  const [isLoading, setIsLoading] = useState(false);
  // IMPORTANTE: Asegúrate de tener setFileName en tu ExcelContext
  const {
    setFileData,
    setWorkbook,
    setSelectedSheet,
    setColumnAnalysis,
    setFileName,
  } = useExcelContext();

  const formatJson = (json) =>
    json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );

  const handleFileChange = (file) => {
    if (!file) return;
    setIsLoading(true);

    // Guardamos el nombre del archivo al momento de cargarlo
    if (setFileName) {
      setFileName(file.name);
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: "binary", cellDates: true });
        setWorkbook(wb);
        const sheetNames = wb.SheetNames;
        setSelectedSheet(sheetNames[0]);
        const sheet = wb.Sheets[sheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false,
          defval: "",
        });
        const formatted = formatJson(json);
        setFileData(formatted);

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
