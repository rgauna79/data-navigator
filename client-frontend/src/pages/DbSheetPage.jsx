import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import {
  listSavedFiles,
  getSavedFile,
  renameSavedFile,
  deleteSavedFile,
} from "../api/data.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faEye, faXmark, faDatabase, faPen, faTrash, faCheck, faSearch,
} from "@fortawesome/free-solid-svg-icons";

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });

const iconButton =
  "w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white transition-colors disabled:opacity-40";

function SavedFileRow({ file, isActive, isOpening, onView, onClose, onRename, onDelete }) {
  const [mode, setMode] = useState("view"); // view | rename | delete
  const [name, setName] = useState(file.sheetName);
  const [isBusy, setIsBusy] = useState(false);

  const cancelRename = () => {
    setMode("view");
    setName(file.sheetName);
  };

  const submitRename = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === file.sheetName) {
      cancelRename();
      return;
    }
    setIsBusy(true);
    const ok = await onRename(file, trimmed);
    setIsBusy(false);
    if (ok) setMode("view");
  };

  const confirmDelete = async () => {
    setIsBusy(true);
    await onDelete(file);
    setIsBusy(false);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 transition-colors ${
        isActive ? "bg-purple-50 dark:bg-purple-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">
          XL
        </div>
        {mode === "rename" ? (
          <form onSubmit={submitRename} className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              aria-label="New name"
              value={name}
              maxLength={200}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelRename();
              }}
              className="flex-1 min-w-0 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={isBusy} className={iconButton} title="Save name" aria-label="Save name">
              <FontAwesomeIcon icon={isBusy ? faSpinner : faCheck} spin={isBusy} />
            </button>
            <button
              type="button"
              className={iconButton}
              title="Cancel"
              aria-label="Cancel rename"
              onClick={cancelRename}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </form>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.sheetName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {file.rowCount.toLocaleString()} rows · {file.columnCount} columns
              {file.updatedAt && <> · Updated {fmtDate(file.updatedAt)}</>}
            </p>
          </div>
        )}
      </div>

      {mode === "delete" ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-300">Delete this file?</span>
          <button
            disabled={isBusy}
            onClick={confirmDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white"
          >
            {isBusy && <FontAwesomeIcon icon={faSpinner} spin />} Delete
          </button>
          <button
            onClick={() => setMode("view")}
            className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        mode === "view" && (
          <div className="flex items-center gap-1">
            <button
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors mr-1 ${
                isActive
                  ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
              disabled={isOpening}
              onClick={() => (isActive ? onClose() : onView(file))}
            >
              <FontAwesomeIcon
                icon={isOpening ? faSpinner : isActive ? faXmark : faEye}
                spin={isOpening}
                className="text-xs"
              />
              {isActive ? "Close" : "View"}
            </button>
            <button className={iconButton} title="Rename" aria-label={`Rename ${file.sheetName}`} onClick={() => setMode("rename")}>
              <FontAwesomeIcon icon={faPen} className="text-xs" />
            </button>
            <button className={iconButton} title="Delete" aria-label={`Delete ${file.sheetName}`} onClick={() => setMode("delete")}>
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
          </div>
        )
      )}
    </div>
  );
}

function DbSheetPage() {
  const [files, setFiles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openingId, setOpeningId] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null); // { id, sheetName, data }

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await listSavedFiles();
      setFiles(res.data);
    } catch (err) {
      setError(errorMessage(err, "Could not load saved files."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // El contenido se descarga solo al abrir un archivo
  const handleView = async (file) => {
    setOpeningId(file._id);
    setError("");
    try {
      const res = await getSavedFile(file._id);
      setActiveSheet({ id: file._id, sheetName: res.data.sheetName, data: res.data.fileData });
    } catch (err) {
      setError(errorMessage(err, "Could not open the file."));
    } finally {
      setOpeningId(null);
    }
  };

  const handleRename = async (file, sheetName) => {
    setError("");
    try {
      const res = await renameSavedFile(file._id, sheetName);
      setFiles((prev) =>
        prev.map((f) => (f._id === file._id ? { ...f, sheetName: res.data.sheetName, updatedAt: res.data.updatedAt } : f))
      );
      setActiveSheet((prev) => (prev?.id === file._id ? { ...prev, sheetName: res.data.sheetName } : prev));
      return true;
    } catch (err) {
      setError(errorMessage(err, "Could not rename the file."));
      return false;
    }
  };

  const handleDelete = async (file) => {
    setError("");
    try {
      await deleteSavedFile(file._id);
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      setActiveSheet((prev) => (prev?.id === file._id ? null : prev));
    } catch (err) {
      setError(errorMessage(err, "Could not delete the file."));
    }
  };

  const query = search.trim().toLowerCase();
  const visibleFiles = (files || []).filter((f) => f.sheetName.toLowerCase().includes(query));

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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {files ? `${files.length} file${files.length === 1 ? "" : "s"} stored in your account` : "Files stored in your account"}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-8 justify-center">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span className="text-sm">Loading saved files...</span>
          </div>
        )}

        {files && !isLoading && (
          <>
            {files.length > 0 && (
              <div className="relative mb-3 sm:max-w-sm">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search saved files..."
                  aria-label="Search saved files"
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                  No saved files yet.{" "}
                  <Link to="/filereader" className="text-blue-500 hover:text-blue-400 font-medium">
                    Open the File Reader
                  </Link>{" "}
                  to upload and save a sheet.
                </div>
              ) : visibleFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  No files match &quot;{search}&quot;.
                </div>
              ) : (
                visibleFiles.map((file) => (
                  <SavedFileRow
                    key={file._id}
                    file={file}
                    isActive={activeSheet?.id === file._id}
                    isOpening={openingId === file._id}
                    onView={handleView}
                    onClose={() => setActiveSheet(null)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Table section */}
        {activeSheet && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {activeSheet.sheetName}
            </h2>
            <DataTable
              key={activeSheet.id}
              rows={activeSheet.data}
              sheetName={activeSheet.sheetName}
              handleCloseTable={() => setActiveSheet(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default DbSheetPage;
