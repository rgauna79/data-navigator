import React from "react";
import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import FileInput from "../components/TableXLXS/FileInput.jsx";
import SheetSelector from "../components/TableXLXS/SheetSelector.jsx";
import ColumnSummary from "../components/ColumnSummary.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel } from "@fortawesome/free-solid-svg-icons";

function FileReaderPage() {
  const {
    workbook, selectedSheet, fileData,
    handleSaveData, columnAnalysis
  } = useDataContext();
  const { isLoggedIn } = useAuth();

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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload and explore your spreadsheet data
            </p>
          </div>
        </div>

        {/* Upload + sheet selector */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6">
          <FileInput />
          {fileData && fileData.length > 0 && workbook && (
            <div className="mt-4">
              <SheetSelector />
            </div>
          )}
        </div>

        {/* Column summary */}
        {columnAnalysis && columnAnalysis.length > 0 && (
          <div className="max-w-full mb-6">
            <ColumnSummary analysis={columnAnalysis} />
          </div>
        )}

        {/* ✅ Data table con showSaveButton={isLoggedIn} */}
        {selectedSheet && (
          <div className="w-full">
            <DataTable
              workbook={workbook}
              selectedSheet={selectedSheet}
              isLoggedIn={isLoggedIn}
              handleSaveData={handleSaveData}
              showSaveButton={isLoggedIn} // ✅ botón Save Data visible si está logueado
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default FileReaderPage;