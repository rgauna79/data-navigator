import React, { useState, useEffect } from "react";
import { useDataContext } from "../context/DataContext";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faEye, faXmark, faDatabase } from "@fortawesome/free-solid-svg-icons";

function DbSheetPage() {
  const { readAllData, dataSaved, isLoadingData, error } = useDataContext();
  const [activeSheet, setActiveSheet] = useState(null); // { index, data }

  useEffect(() => {
    readAllData();
  }, []);

  const handleViewTable = (index) => {
    setActiveSheet({ index, data: dataSaved.data[index].fileData });
  };

  const handleCloseTable = () => {
    setActiveSheet(null);
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FontAwesomeIcon icon={faDatabase} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saved Files</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Files stored in the database</p>
          </div>
        </div>

        {/* Loading */}
        {isLoadingData && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-8 justify-center">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span className="text-sm">Loading saved files...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl">
            Error: {error.message}
          </div>
        )}

        {/* File list */}
        {dataSaved && !isLoadingData && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            {dataSaved.data.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                No saved files yet.
              </div>
            ) : (
              dataSaved.data.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between px-4 py-3 ${
                    index !== dataSaved.data.length - 1
                      ? "border-b border-gray-100 dark:border-gray-700"
                      : ""
                  } ${
                    activeSheet?.index === index
                      ? "bg-purple-50 dark:bg-purple-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  } transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                      XL
                    </div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.sheetName}
                    </span>
                  </div>
                  <button
                    className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      activeSheet?.index === index
                        ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    }`}
                    onClick={() =>
                      activeSheet?.index === index
                        ? handleCloseTable()
                        : handleViewTable(index)
                    }
                  >
                    <FontAwesomeIcon
                      icon={activeSheet?.index === index ? faXmark : faEye}
                      className="text-xs"
                    />
                    {activeSheet?.index === index ? "Close" : "View"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Table section */}
        {activeSheet && (
          <div className="mt-6">
            <DataTable sheetSaved={activeSheet.data} />
          </div>
        )}
      </div>
    </div>
  );
}

export default DbSheetPage;