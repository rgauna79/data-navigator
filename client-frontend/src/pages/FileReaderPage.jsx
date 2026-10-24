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
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 max-w-4xl mx-auto">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
            <FontAwesomeIcon icon={faFileExcel} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Excel Reader</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Upload and explore your spreadsheet data</p>
          </div>
        </div>

        {/* Error */}
        {loadError && (
          <div className="max-w-4xl mx-auto mb-6 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
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
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6">
          <FileInput />
          {sheetNames.length > 0 && (
            <div className="mt-4">
              <SheetSelector />
            </div>
          )}
        </div>

        {/* Column summary — aparece automáticamente al cargar */}
        {columnAnalysis && columnAnalysis.length > 0 && (
          <div className="max-w-full mb-6 px-0">
            <ColumnSummary analysis={columnAnalysis} onChangeType={setColumnOverride} />
          </div>
        )}

        {/* Data table */}
        {selectedSheet && hasSheetData && !loadError && (
          <div className="w-full">
            <DataTable
              rows={fileData}
              normalized
              columnTypes={columnTypes}
              sheetName={selectedSheet}
              showSaveButton={isLoggedIn}
            />
          </div>
        )}

        {/* Empty sheet feedback */}
        {selectedSheet && !hasSheetData && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
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
