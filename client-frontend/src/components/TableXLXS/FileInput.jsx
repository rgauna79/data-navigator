import React from "react";
import { useState } from "react";
import { useDataContext } from "../../context/DataContext.jsx";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

function FileInput() {
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

  const handleFileChange = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const file = e.target.files[0];
    if (!file) {
      setIsLoading(false);
      return;
    }
    if (!file.name.endsWith(".xlsx")) {
      alert("Please select an xlsx file");
      setIsLoading(false);
      return;
    }
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
      }
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-center">
        <input
          type="file"
          className="p-2 border-gray-300 border bg-white rounded mr-2 w-full"
          id="fileInput"
          aria-describedby="readFile"
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
        />
      </div>
      {isLoading && (
        <div className="flex items-center mt-4 justify-center">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span className="ml-2">Loading</span>
        </div>
      )}
    </>
  );
}

export default FileInput;
