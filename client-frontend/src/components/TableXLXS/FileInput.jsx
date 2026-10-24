import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faFileExcel,
  faSpinner,
  faTriangleExclamation,
  faXmark,
  faFileCsv,
  faRotate,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { useExcelData } from "../../hooks/useExcelData.js";
import { useExcelContext } from "../../context/ExcelContext.jsx";
import { useI18n } from "../../i18n/I18nContext.jsx";
import { SUPPORTED_EXTENSIONS, TEXT_EXTENSIONS, extensionOf, isSupportedFile } from "../../utils/fileTypes.js";
import { sampleFile } from "../../utils/sampleData.js";
import SheetSelector from "./SheetSelector.jsx";

const MAX_FILE_SIZE_MB = 20;

// Zona para subir un archivo o, con un archivo abierto, una barra compacta
// con el nombre, la hoja y los botones para cambiarlo o cerrarlo.
function FileInput() {
  const { handleFileChange, isLoading } = useExcelData();
  // El archivo abierto vive en el contexto para sobrevivir a recargas
  const { fileInfo, resetExcel } = useExcelContext();
  const { t, lang, fmtNumber } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${fmtNumber(bytes)} B`;
    if (bytes < 1024 * 1024) return `${fmtNumber(bytes / 1024, { maximumFractionDigits: 1 })} KB`;
    return `${fmtNumber(bytes / (1024 * 1024), { maximumFractionDigits: 1 })} MB`;
  };

  const validateAndProcessFile = (file) => {
    setError(null);
    if (!file) return;

    // Se valida por extensión: el tipo MIME de CSV y XLS varía según el sistema
    if (!isSupportedFile(file.name)) {
      setError(t("Unsupported file type. Use Excel (.xlsx, .xls), OpenDocument (.ods) or CSV files."));
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setError(
        t("File is too large ({size}MB). Maximum allowed is {max}MB.", {
          size: fmtNumber(fileSizeMB, { maximumFractionDigits: 1 }),
          max: MAX_FILE_SIZE_MB,
        })
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
    }
  };

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  // Cierra el archivo: limpia la tabla, el resumen y la copia guardada en el navegador
  const handleRemoveFile = () => {
    resetExcel();
    setError(null);
  };

  const input = (
    <input
      type="file"
      accept={SUPPORTED_EXTENSIONS.join(",")}
      className="hidden"
      ref={fileInputRef}
      onChange={onFileSelect}
      disabled={isLoading}
    />
  );

  const errorBox = error && !isLoading && (
    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-xl border border-red-200 dark:border-red-800">
      <FontAwesomeIcon icon={faTriangleExclamation} />
      {error}
    </div>
  );

  // --- ARCHIVO ABIERTO: barra compacta ---
  if (fileInfo) {
    const isText = TEXT_EXTENSIONS.includes(extensionOf(fileInfo.name));
    return (
      <div className="w-full">
        {input}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={isLoading ? faSpinner : isText ? faFileCsv : faFileExcel} spin={isLoading} className="text-xl" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={fileInfo.name}>
                {fileInfo.name}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {isLoading ? t("Reading file...") : formatFileSize(fileInfo.size)}
              </p>
            </div>
          </div>
          <SheetSelector />
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <FontAwesomeIcon icon={faRotate} className="text-xs" /> {t("Change file")}
            </button>
            <button
              onClick={handleRemoveFile}
              title={t("Remove file")}
              aria-label={t("Remove file")}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>
        {errorBox}
      </div>
    );
  }

  // --- SIN ARCHIVO: zona para soltarlo ---
  return (
    <div className="w-full">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ease-in-out overflow-hidden
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : error
              ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer"
              : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          }
          ${isLoading ? "pointer-events-none opacity-80" : ""}
        `}
      >
        {input}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{t("Reading file...")}</p>
              <p className="text-sm text-gray-500">{t("Reading rows and generating insights")}</p>
            </div>
          </div>
        ) : (
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
                {isDragging ? t("Drop your file here") : t("Drag & drop your Excel or CSV file")}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("or")}{" "}
                <span className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">{t("browse files")}</span>
                {" "}· {t(".xlsx, .xls, .ods, .csv up to {max}MB", { max: MAX_FILE_SIZE_MB })}
              </p>
            </div>
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{t("No file at hand?")}</span>
          <button
            onClick={() => handleFileChange(sampleFile(lang))}
            className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs" /> {t("Try it with sample data")}
          </button>
        </div>
      )}

      {errorBox}
    </div>
  );
}

export default FileInput;
