import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDownload, faFileCsv, faFileExcel, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { downloadCsv, exportRows } from "../../utils/reportUtils.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

// Nombre de archivo seguro a partir del nombre de la hoja
const baseFileName = (name) =>
  (name || "data").replace(/[\\/:*?"<>|]/g, " ").trim().replace(/\s+/g, "_") || "data";

// Exporta las filas visibles de la tabla (con búsqueda y orden aplicados,
// todas las páginas) a CSV o Excel.
// getRows: devuelve las filas a exportar en el momento del clic.
// decimalOf(i): separador decimal de la columna i, para convertir a número al exportar a Excel
function ExportMenu({ headers, getRows, numericCols, decimalOf, sheetName, isFiltered }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cierra el menú al hacer clic fuera o pulsar Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fileName = `${baseFileName(sheetName)}${isFiltered ? "_filtered" : ""}`;

  const exportCsv = () => {
    setOpen(false);
    // El CSV conserva el texto tal como se ve en la tabla
    downloadCsv(`${fileName}.csv`, exportRows(headers, getRows()));
  };

  const exportExcel = async () => {
    setOpen(false);
    // xlsx se carga solo al exportar (en la página de archivos guardados no está cargado)
    const { downloadXlsx } = await import("../../utils/sheetParser.js");
    const numeric = new Set([...numericCols].map(Number));
    downloadXlsx(`${fileName}.xlsx`, sheetName, exportRows(headers, getRows(), numeric, decimalOf));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 transition-colors"
      >
        <FontAwesomeIcon icon={faDownload} className="text-xs" />
        {t("Export")}
        <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 sm:left-0 sm:right-auto mt-1 z-20 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1"
        >
          {isFiltered && (
            <p className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">{t("Only rows matching the search")}</p>
          )}
          <button
            role="menuitem"
            onClick={exportCsv}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faFileCsv} className="text-blue-500 w-4" /> CSV (.csv)
          </button>
          <button
            role="menuitem"
            onClick={exportExcel}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faFileExcel} className="text-green-600 w-4" /> Excel (.xlsx)
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
