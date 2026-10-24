import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nContext.jsx";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import FileInput from "../components/TableXLXS/FileInput.jsx";
import ColumnSummary from "../components/ColumnSummary.jsx";
import InsightsPanel from "../components/InsightsPanel.jsx";
import { hasUsableData } from "../utils/excelUtils.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faSpinner, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

function FileReaderPage() {
  const {
    fileInfo, selectedSheet, fileData, columnAnalysis, columnTypes, setColumnOverride,
    loadError, isRestoringFile,
  } = useDataContext();
  const { isLoggedIn } = useAuth();
  const { t } = useI18n();

  const hasSheetData = hasUsableData(fileData);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative">
      <div className="max-w-full px-4 py-8">
        {/* Header */}
        <div className={`flex items-center gap-4 max-w-4xl mx-auto ${fileInfo ? "mb-5" : "mb-8"}`}>
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 shadow-xs">
            <FontAwesomeIcon icon={faFileExcel} className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {t("Excel Reader")}
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("Upload, analyze, clean and store your spreadsheet data")}
            </p>
          </div>
        </div>

        {/* Error */}
        {loadError && (
          <div className="max-w-4xl mx-auto mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
            <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0" />
            {t(loadError)}
          </div>
        )}

        {/* Restaurando el último archivo abierto */}
        {isRestoringFile && (
          <div className="max-w-4xl mx-auto mb-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin />
            {t("Restoring your last file...")}
          </div>
        )}

        {/* Upload, o barra compacta con el archivo abierto */}
        <div
          className={`mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs ${
            fileInfo ? "max-w-full rounded-2xl px-4 py-3 mb-6" : "max-w-4xl rounded-3xl p-6 mb-8"
          }`}
        >
          <FileInput />
        </div>

        {/* Column summary — aparece automáticamente al cargar */}
        {columnAnalysis?.length > 0 && (
          <div className="max-w-full mb-6">
            <ColumnSummary
              analysis={columnAnalysis}
              onChangeType={setColumnOverride}
              fileData={fileData}
              columnTypes={columnTypes}
            />
          </div>
        )}

        {/* Conclusiones automáticas de la hoja */}
        {selectedSheet && hasSheetData && !loadError && (
          <div className="max-w-full mb-6">
            <InsightsPanel fileData={fileData} analysis={columnAnalysis} columnTypes={columnTypes} />
          </div>
        )}

        {/* Data table */}
        {selectedSheet && hasSheetData && !loadError && (
          <div className="w-full">
            <DataTable
              rows={fileData}
              normalized
              editable
              columnTypes={columnTypes}
              sheetName={selectedSheet}
              showSaveButton={isLoggedIn}
            />
          </div>
        )}

        {/* Empty sheet feedback */}
        {selectedSheet && !hasSheetData && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 text-center">
            <FontAwesomeIcon icon={faFileExcel} className="text-3xl text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t("This sheet does not contain data. Select another sheet or upload a different file.")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileReaderPage;
