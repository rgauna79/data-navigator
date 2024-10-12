import React from "react";
import { useState } from "react";
import { useDataContext } from "../../context/DataContext.jsx";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { useExcelData } from "../../hooks/useExcelData.js";

function FileInput() {
  const { handleFileChange, isLoading } = useExcelData();
  return (
    <>
      <div className="mb-2 flex items-center justify-center">
        <input
          type="file"
          className="p-2 border-gray-300 border bg-white rounded mr-2 w-full"
          id="fileInput"
          aria-describedby="readFile"
          accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => handleFileChange(e.target.files[0])}
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
