import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faFileExcel,
  faSpinner,
  faTriangleExclamation,
  faXmark,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import { useExcelData } from "../../hooks/useExcelData";
import { useDataContext } from "../../context/DataContext";

function FileInput() {
  const { handleFileChange, isLoading } = useExcelData();
  const { fileName, resetExcel } = useDataContext(); // Usamos fileName del contexto para persistencia
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE_MB = 15;

  const validateAndProcessFile = (file) => {
    setError(null);
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError("Invalid file type. Please upload a .xlsx, .xls, or .csv file.");
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setError(
        `File is too large (${fileSizeMB.toFixed(
          1
        )}MB). Maximum allowed is ${MAX_FILE_SIZE_MB}MB.`
      );
      return;
    }

    handleFileChange(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
      e.target.value = null;
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation(); // Evitamos que abra el selector de archivos al hacer clic en la X
    resetExcel();
    setError(null);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && !fileName && fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ease-in-out overflow-hidden
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : fileName
              ? "border-green-500 bg-green-50/30 dark:bg-green-900/10 cursor-default"
              : error
              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer"
              : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          }
          ${isLoading ? "pointer-events-none opacity-80" : ""}
        `}
      >
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileSelect}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-3xl text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Processing Data...
              </p>
              <p className="text-sm text-gray-500">
                Reading rows and generating insights
              </p>
            </div>
          </div>
        ) : fileName ? (
          /* --- VISTA DE ARCHIVO CARGADO --- */
          <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="relative group">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon
                  icon={fileName.endsWith(".csv") ? faFileCsv : faFileExcel}
                  className="text-3xl"
                />
              </div>
              <button
                onClick={handleRemoveFile}
                title="Remove file"
                className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-full shadow-md border border-gray-100 dark:border-gray-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-xs">
                {fileName}
              </p>
              <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mt-1">
                Ready to analyze
              </p>
            </div>
          </div>
        ) : (
          /* --- VISTA INICIAL / DRAG ZONE --- */
          <div className="flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isDragging
                  ? "bg-blue-200 text-blue-700"
                  : "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-300 shadow-sm"
              }`}
            >
              <FontAwesomeIcon
                icon={isDragging ? faCloudArrowUp : faFileExcel}
                className="text-3xl"
              />
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {isDragging
                  ? "Drop your Excel file here"
                  : "Drag & drop your Excel file"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or{" "}
                <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                  browse files
                </span>{" "}
                · .xlsx or .csv up to 15MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && !isLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-xl border border-red-200 dark:border-red-800 animate-in slide-in-from-top-2">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {error}
        </div>
      )}
    </div>
  );
}

export default FileInput;
