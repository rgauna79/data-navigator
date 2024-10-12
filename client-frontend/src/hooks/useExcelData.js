import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { useDataContext } from "../context/DataContext";

export const useExcelData = () => {
  // const [workbook, setWorkbook] = useState(null);
  // const [selectedSheet, setSelectedSheet] = useState(null);
  // const [fileData, setFileData] = useState(null);
  // const [isLoading, setIsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { setFileData, setWorkbook, setSelectedSheet, workbook } =
    useDataContext();

  const formatJson = (json) => {
    return json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );
  };

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
        setFileData(formatJson(json));
      } catch (error) {
        console.error("Error while reading file:", error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return {
    // workbook,
    // selectedSheet,
    // fileData,
    isLoading,
    // setWorkbook,
    // setSelectedSheet,
    // setFileData,
    handleFileChange,
  };
};
