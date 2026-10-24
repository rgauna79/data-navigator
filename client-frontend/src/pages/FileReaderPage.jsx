import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import FileInput from "../components/TableXLXS/FileInput.jsx";
import SheetSelector from "../components/TableXLXS/SheetSelector.jsx";
import ColumnSummary from "../components/ColumnSummary.jsx";
import { hasUsableData } from "../utils/excelUtils.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faSpinner, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

function FileReaderPage() {
  const {
    sheetNames, selectedSheet, fileData, columnAnalysis, columnTypes, setColumnOverride,
    loadError, isRestoringFile,
  } = useDataContext();
  const { isLoggedIn } = useAuth();

  const hasSheetData = hasUsableData(fileData);

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative">
      <div className="max-w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 max-w-4xl mx-auto">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 shadow-xs">
            <FontAwesomeIcon icon={faFileExcel} className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Excel Reader
            </h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Upload, analyze, clean and store your spreadsheet data
            </p>
          </div>
        </div>

        {/* Error */}
        {loadError && (
          <div className="max-w-4xl mx-auto mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
            <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0" />
            {loadError}
          </div>
        )}

        {/* Restaurando el último archivo abierto */}
        {isRestoringFile && (
          <div className="max-w-4xl mx-auto mb-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin />
            Restoring your last file...
          </div>
        )}

        {/* Upload + sheet selector */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 mb-8 shadow-xs">
          <FileInput />
          {sheetNames.length > 0 && (
            <div className="mt-6">
              <SheetSelector />
            </div>
          )}
        </div>

        {/* Column summary — aparece automáticamente al cargar */}
        {columnAnalysis?.length > 0 && (
          <div className="max-w-full mb-8">
            <ColumnSummary analysis={columnAnalysis} onChangeType={setColumnOverride} />
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
              This sheet does not contain data. Select another sheet or upload a different file.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileReaderPage;
