import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlassChart, faXmark } from "@fortawesome/free-solid-svg-icons";
import DataTable from "../TableXLXS/DataTable.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useI18n } from "../../i18n/I18nContext.jsx";

// Muestra las filas que hay detrás de un resultado (una barra, un grupo, un
// valor...). Desde aquí se pueden buscar, filtrar, exportar, guardar o usar
// para un informe nuevo solo con esas filas.
// rows: filas de datos (sin encabezados); headers y columnTypes de la hoja.
function DrillDownModal({ title, subtitle, headers, rows, columnTypes, onClose }) {
  const { t, tn } = useI18n();
  const { isLoggedIn } = useAuth();

  // Escape cierra la ventana
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-xs flex justify-center items-start sm:items-center p-2 sm:p-6">
      <div
        role="dialog"
        aria-labelledby="drilldown-title"
        className="bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-6xl max-h-[95vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 px-5 py-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xs border-b border-gray-200 dark:border-gray-700 rounded-t-3xl">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faMagnifyingGlassChart} />
            </div>
            <div className="min-w-0">
              <h2 id="drilldown-title" className="text-lg font-black text-gray-900 dark:text-white truncate">
                {title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle ? `${subtitle} · ` : ""}
                {tn("{count} row", "{count} rows", rows.length)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t("Close")}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t("No rows to display.")}</p>
          ) : (
            <DataTable
              rows={[headers, ...rows]}
              columnTypes={columnTypes || undefined}
              sheetName={title}
              showSaveButton={isLoggedIn}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DrillDownModal;
