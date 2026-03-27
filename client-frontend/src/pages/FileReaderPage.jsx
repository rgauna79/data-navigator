import React, { useState, useEffect } from "react";
import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import FileInput from "../components/TableXLXS/FileInput.jsx";
import SheetSelector from "../components/TableXLXS/SheetSelector.jsx";
import ColumnSummary from "../components/ColumnSummary.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExcel,
  faFloppyDisk,
  faTriangleExclamation,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";

function FileReaderPage() {
  const {
    workbook,
    selectedSheet,
    fileData,
    handleSaveData,
    columnAnalysis,
    dataSaved,
    readAllData,
    resetSaveStatus,
  } = useDataContext();
  const { isLoggedIn } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [showOverwrite, setShowOverwrite] = useState(false);

  // Cargar lista al montar
  useEffect(() => {
    if (isLoggedIn) readAllData();
  }, [isLoggedIn]);

  // Actualizar nombre temporal cuando cambie la hoja
  useEffect(() => {
    if (selectedSheet) setTempName(selectedSheet);
  }, [selectedSheet]);

  // Lógica inteligente: Detectar duplicados mientras el usuario escribe
  useEffect(() => {
    const exists = dataSaved?.some(
      (item) => item.sheetName.toLowerCase() === tempName.trim().toLowerCase()
    );
    setShowOverwrite(exists);
  }, [tempName, dataSaved]);

  const handleOpenModal = () => {
    resetSaveStatus();
    setIsModalOpen(true);
  };

  const onSaveConfirm = (overwrite = false) => {
    if (!tempName.trim()) return alert("Please provide a name.");

    // Llamamos a la función del contexto
    handleSaveData({
      sheetName: tempName.trim(),
      fileData,
      overwrite,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-64px)] relative">
      <div className="max-w-full px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 max-w-4xl mx-auto">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
            <FontAwesomeIcon icon={faFileExcel} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Excel Reader
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage and store your spreadsheet data
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 shadow-sm">
          <FileInput />
          {fileData?.length > 0 && workbook && (
            <div className="mt-4">
              <SheetSelector />
            </div>
          )}
        </div>

        {columnAnalysis?.length > 0 && (
          <div className="max-w-full mb-6">
            <ColumnSummary analysis={columnAnalysis} />
          </div>
        )}

        {selectedSheet && (
          <div className="w-full">
            <DataTable
              workbook={workbook}
              selectedSheet={selectedSheet}
              isLoggedIn={isLoggedIn}
              handleSaveTrigger={handleOpenModal}
              showSaveButton={isLoggedIn}
            />
          </div>
        )}
      </div>

      {/* MODAL INTELIGENTE Y COMPACTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-in zoom-in duration-200">
            <div className="p-8 text-center">
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 text-2xl ${
                  showOverwrite
                    ? "bg-amber-100 text-amber-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <FontAwesomeIcon
                  icon={showOverwrite ? faTriangleExclamation : faFloppyDisk}
                />
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                {showOverwrite ? "Name Conflict" : "Save Spreadsheet"}
              </h3>

              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                {showOverwrite
                  ? `"${tempName}" already exists. Overwrite or use a new name?`
                  : "Give this sheet a name to save it in your records."}
              </p>

              <input
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className={`w-full bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl px-5 py-3.5 font-bold outline-none transition-all ${
                  showOverwrite
                    ? "border-amber-400"
                    : "border-gray-100 dark:border-gray-700 focus:border-green-500"
                }`}
              />
            </div>

            <div className="p-8 pt-0 flex flex-col gap-3">
              {showOverwrite ? (
                <>
                  <button
                    onClick={() => onSaveConfirm(true)}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <FontAwesomeIcon icon={faFileImport} /> Overwrite Existing
                  </button>
                  <button
                    onClick={() => onSaveConfirm(false)}
                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold transition-transform active:scale-95"
                  >
                    Save as New Copy
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onSaveConfirm(false)}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-100 dark:shadow-none transition-transform active:scale-95"
                >
                  Confirm & Save
                </button>
              )}

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileReaderPage;
