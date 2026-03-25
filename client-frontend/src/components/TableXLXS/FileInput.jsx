import React, { useState, useRef, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faFileExcel,
  faCloudArrowUp,
  faXmark,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useExcelData } from "../../hooks/useExcelData.js";

function FileInput() {
  const { handleFileChange, isLoading } = useExcelData();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return "No file selected.";
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx")) {
      return "Only .xlsx files are supported.";
    }
    if (file.size > 20 * 1024 * 1024) {
      return "File must be under 20MB.";
    }
    return null;
  };

  const processFile = useCallback(
    (file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setSelectedFile(null);
        return;
      }
      setError(null);
      setSelectedFile(file);
      handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* Drop zone */}
      {!selectedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 py-10 px-4
            ${isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/30"
            }`}
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-colors
            ${isDragging ? "bg-blue-100 text-blue-500" : "bg-gray-100 dark:bg-gray-700 text-gray-400"}`}>
            <FontAwesomeIcon icon={faCloudArrowUp} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragging ? "Drop your file here" : "Drag & drop your Excel file"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              or <span className="text-blue-500 font-medium">browse files</span> · .xlsx up to 20MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* File preview */}
      {selectedFile && !isLoading && (
        <div className="flex items-center gap-3 w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-4 py-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-800/40 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
            <FontAwesomeIcon icon={faFileExcel} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 flex-shrink-0" />
          <button
            onClick={clearFile}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0 ml-1"
            title="Remove file"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-4 text-blue-600 dark:text-blue-400 text-sm">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Reading file...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-3 py-2">
          <FontAwesomeIcon icon={faXmark} />
          {error}
        </div>
      )}
    </div>
  );
}

export default FileInput;