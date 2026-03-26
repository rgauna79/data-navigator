import React, { useState, useEffect } from "react";
import { useDataContext } from "../context/DataContext";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faEye, faXmark, faDatabase, faTrash, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import axios from "../api/axios";

function DbSheetPage() {
  const { readAllData, dataSaved, isLoadingData, error } = useDataContext();
  const [activeSheet, setActiveSheet] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  const [showConfirm, setShowConfirm] = useState({ 
    show: false, id: null, index: null, name: "", rowCount: 0 
  });

  useEffect(() => { readAllData(); }, []);

  const sheets = Array.isArray(dataSaved)
    ? dataSaved
    : Array.isArray(dataSaved?.data)
      ? dataSaved.data
      : [];

  const handleViewTable = (index) => {
    setActiveSheet({ index, data: sheets[index].fileData });
  };

  const handleCloseTable = () => setActiveSheet(null);

  const confirmDelete = (id, index, name, rowCount) => {
    setShowConfirm({ show: true, id, index, name, rowCount });
  };

  const handleDelete = async () => {
    const { id, index } = showConfirm;
    setDeletingId(id);
    setShowConfirm({ show: false, id: null, index: null, name: "", rowCount: 0 });

    try {
      await axios.delete(`/data/${id}`);
      if (activeSheet?.index === index) setActiveSheet(null);
      await readAllData();
    } catch (err) {
      console.error("Error deleting:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)] relative">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FontAwesomeIcon icon={faDatabase} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saved Files</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Files stored in the database {sheets.length > 0 && ` · ${sheets.length} sheets`}
            </p>
          </div>
        </div>

        {isLoadingData && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-8 justify-center">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span className="text-sm">Loading saved files...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl">
            Error loading data. Please try again.
          </div>
        )}

        {!isLoadingData && !error && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
            {sheets.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                No saved files yet.
              </div>
            ) : (
              sheets.map((item, index) => (
                <div 
                  key={item._id || index} 
                  className={`flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
                    activeSheet?.index === index ? "bg-purple-50 dark:bg-purple-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                      XL
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.sheetName}</p>
                      {item.updatedAt && (
                        <p className="text-[10px] text-gray-400">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                        activeSheet?.index === index
                          ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                      onClick={() => activeSheet?.index === index ? handleCloseTable() : handleViewTable(index)}
                    >
                      <FontAwesomeIcon icon={activeSheet?.index === index ? faXmark : faEye} className="text-xs" />
                      {activeSheet?.index === index ? "Close" : "View"}
                    </button>

                    {item._id && (
                      <button
                        onClick={() => confirmDelete(item._id, index, item.sheetName, item.fileData?.length || 0)}
                        disabled={deletingId === item._id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                      >
                        <FontAwesomeIcon 
                          icon={deletingId === item._id ? faSpinner : faTrash} 
                          spin={deletingId === item._id} 
                          className="text-xs" 
                        />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSheet && (
          <div className="mt-6 border-t pt-6 border-gray-200 dark:border-gray-700">
            <DataTable sheetSaved={activeSheet.data} />
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {showConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-xl">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Permanent Delete</h3>
                <p className="text-xs text-red-500 font-medium">This cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-300 italic">You are about to delete:</p>
              <p className="font-bold text-gray-900 dark:text-white truncate">{showConfirm.name}</p>
              <div className="mt-2">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded">
                  {showConfirm.rowCount.toLocaleString()} Rows
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm({ show: false, id: null, index: null, name: "", rowCount: 0 })}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DbSheetPage;