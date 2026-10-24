import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import DataTable from "../components/TableXLXS/DataTable.jsx";
import {
  listSavedFiles,
  getSavedFile,
  renameSavedFile,
  deleteSavedFile,
} from "../api/data.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { useOpenInReader } from "../hooks/useOpenInReader.js";
import { fileFromRows } from "../utils/fileFromRows.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faEye, faXmark, faDatabase, faPen, faTrash, faCheck, faSearch, faFileExcel,
} from "@fortawesome/free-solid-svg-icons";

const DATE_TIME = { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" };

const iconButton =
  "w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-white transition-colors disabled:opacity-40";

function SavedFileRow({ file, isActive, isOpening, onView, onClose, onRename, onDelete, onOpenInReader }) {
  const { t, tn, locale } = useI18n();
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
        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold shrink-0">
          XL
        </div>
        {mode === "rename" ? (
          <form onSubmit={submitRename} className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              aria-label={t("New name")}
              value={name}
              maxLength={200}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelRename();
              }}
              className="flex-1 min-w-0 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={isBusy} className={iconButton} title={t("Save name")} aria-label={t("Save name")}>
              <FontAwesomeIcon icon={isBusy ? faSpinner : faCheck} spin={isBusy} />
            </button>
            <button
              type="button"
              className={iconButton}
              title={t("Cancel")}
              aria-label={t("Cancel rename")}
              onClick={cancelRename}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </form>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{file.sheetName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {tn("{count} row", "{count} rows", file.rowCount)} · {tn("{count} column", "{count} columns", file.columnCount)}
              {file.updatedAt && (
                <> · {t("Updated {date}", { date: new Date(file.updatedAt).toLocaleString(locale, DATE_TIME) })}</>
              )}
            </p>
          </div>
        )}
      </div>

      {mode === "delete" ? (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 dark:text-gray-300">{t("Delete this file?")}</span>
          <button
            disabled={isBusy}
            onClick={confirmDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white"
          >
            {isBusy && <FontAwesomeIcon icon={faSpinner} spin />} {t("Delete")}
          </button>
          <button
            onClick={() => setMode("view")}
            className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {t("Cancel")}
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
              {isActive ? t("Close") : t("View")}
            </button>
            <button
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mr-1 disabled:opacity-50"
              title={t("Open in the Reader to analyze, clean and create reports")}
              aria-label={t("Open {name} in the Reader", { name: file.sheetName })}
              disabled={isOpening}
              onClick={() => onOpenInReader(file)}
            >
              <FontAwesomeIcon icon={faFileExcel} className="text-xs text-green-600" />
              <span className="hidden sm:inline">{t("Analyze")}</span>
            </button>
            <button className={iconButton} title={t("Rename")} aria-label={t("Rename {name}", { name: file.sheetName })} onClick={() => setMode("rename")}>
              <FontAwesomeIcon icon={faPen} className="text-xs" />
            </button>
            <button className={iconButton} title={t("Delete")} aria-label={t("Delete {name}", { name: file.sheetName })} onClick={() => setMode("delete")}>
              <FontAwesomeIcon icon={faTrash} className="text-xs" />
            </button>
          </div>
        )
      )}
    </div>
  );
}

function DbSheetPage() {
  const { t, tn, tServer } = useI18n();
  const openInReader = useOpenInReader();
  const errorMessage = useCallback(
    (err, fallback) => tServer(err.response?.data?.message, fallback),
    [tServer]
  );
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
  }, [errorMessage]);

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
      toast.success(t('Renamed to "{name}"', { name: res.data.sheetName }));
      return true;
    } catch (err) {
      setError(errorMessage(err, "Could not rename the file."));
      return false;
    }
  };

  // Abre el archivo guardado en el lector (informes, edición, comparación...)
  const handleOpenInReader = async (file) => {
    setOpeningId(file._id);
    setError("");
    try {
      const res = await getSavedFile(file._id);
      await openInReader(fileFromRows(res.data.sheetName, res.data.fileData));
    } catch (err) {
      setError(errorMessage(err, "Could not open the file."));
      setOpeningId(null);
    }
  };

  const handleDelete = async (file) => {
    setError("");
    try {
      await deleteSavedFile(file._id);
      setFiles((prev) => prev.filter((f) => f._id !== file._id));
      setActiveSheet((prev) => (prev?.id === file._id ? null : prev));
      toast.success(t("File deleted successfully"));
    } catch (err) {
      setError(errorMessage(err, "Could not delete the file."));
    }
  };

  const query = search.trim().toLowerCase();
  const visibleFiles = (files || []).filter((f) => f.sheetName.toLowerCase().includes(query));

  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 relative">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FontAwesomeIcon icon={faDatabase} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{t("Saved Files")}</h1>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {files
                ? tn("{count} file stored in your account", "{count} files stored in your account", files.length)
                : t("Files stored in your account")}
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
            <span className="text-sm">{t("Loading saved files...")}</span>
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
                  placeholder={t("Search saved files...")}
                  aria-label={t("Search saved files")}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700 shadow-xs">
              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
                  {t("No saved files yet.")}{" "}
                  <Link to="/filereader" className="text-blue-500 hover:text-blue-400 font-medium">
                    {t("Open the File Reader")}
                  </Link>{" "}
                  {t("to upload and save a sheet.")}
                </div>
              ) : visibleFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                  {t('No files match "{search}".', { search })}
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
                    onOpenInReader={handleOpenInReader}
                  />
                ))
              )}
            </div>
          </>
        )}

        {/* Table section */}
        {activeSheet && (
          <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-black text-gray-900 dark:text-white mb-4">
              {t("Viewing:")} <span className="text-purple-600 dark:text-purple-400">{activeSheet.sheetName}</span>
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
