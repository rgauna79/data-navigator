import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faFileExcel,
  faSpinner,
  faTriangleExclamation,
  faXmark,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";
import { useExcelData } from "../../hooks/useExcelData.js";
import { useExcelContext } from "../../context/ExcelContext.jsx";
import { SUPPORTED_EXTENSIONS, TEXT_EXTENSIONS, extensionOf, isSupportedFile } from "../../utils/fileTypes.js";

const MAX_FILE_SIZE_MB = 20;

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function FileInput() {
  const { handleFileChange, isLoading } = useExcelData();
  // El archivo abierto vive en el contexto para sobrevivir a recargas
  const { fileInfo, resetExcel } = useExcelContext();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndProcessFile = (file) => {
    setError(null);
    if (!file) return;

    // Se valida por extensión: el tipo MIME de CSV y XLS varía según el sistema
    if (!isSupportedFile(file.name)) {
      setError("Unsupported file type. Use Excel (.xlsx, .xls), OpenDocument (.ods) or CSV files.");
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setError(`File is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed is ${MAX_FILE_SIZE_MB}MB.`);
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
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  // Cierra el archivo: limpia la tabla, el resumen y la copia guardada en el navegador
  const handleRemoveFile = (e) => {
    e.stopPropagation(); // Evita abrir el selector de archivos al hacer clic en la X
    resetExcel();
    setError(null);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && !fileInfo && fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ease-in-out overflow-hidden
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : fileInfo
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
          accept={SUPPORTED_EXTENSIONS.join(",")}
          className="hidden"
          ref={fileInputRef}
          onChange={onFileSelect}
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Reading file...</p>
              <p className="text-sm text-gray-500">Reading rows and generating insights</p>
            </div>
          </div>
        ) : fileInfo ? (
          /* --- ARCHIVO CARGADO --- */
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-4">
                <FontAwesomeIcon
                  icon={TEXT_EXTENSIONS.includes(extensionOf(fileInfo.name)) ? faFileCsv : faFileExcel}
                  className="text-3xl"
                />
              </div>
              <button
                onClick={handleRemoveFile}
                title="Remove file"
                aria-label="Remove file"
                className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-full shadow-md border border-gray-100 dark:border-gray-600 flex items-center justify-center transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </div>
            <div className="min-w-0 max-w-full">
              <p className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-xs mx-auto">
                {fileInfo.name}
              </p>
              <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mt-1">
                {formatFileSize(fileInfo.size)} · Ready to analyze
              </p>
            </div>
          </div>
        ) : (
          /* --- ZONA PARA SOLTAR EL ARCHIVO --- */
          <div className="flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isDragging
                  ? "bg-blue-200 text-blue-700"
                  : "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-300 shadow-xs"
              }`}
            >
              <FontAwesomeIcon icon={isDragging ? faCloudArrowUp : faFileExcel} className="text-3xl" />
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                {isDragging ? "Drop your file here" : "Drag & drop your Excel or CSV file"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                or{" "}
                <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">browse files</span>
                {" "}· .xlsx, .xls, .ods, .csv up to {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && !isLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-xl border border-red-200 dark:border-red-800">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          {error}
        </div>
      )}
    </div>
  );
}

export default FileInput;
