import { useDataContext } from "../../context/DataContext";
import { useExcelData } from "../../hooks/useExcelData.js";
import { useI18n } from "../../i18n/I18nContext.jsx";

function SheetSelector() {
  const { sheetNames, selectedSheet } = useDataContext();
  const { loadSheet, isLoading } = useExcelData();
  const { t } = useI18n();

  if (sheetNames.length === 0) return null;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <label htmlFor="sheetDropdown" className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 shrink-0">
        {t("Sheet")}
      </label>
      <select
        name="sheetDropdown"
        id="sheetDropdown"
        disabled={isLoading || sheetNames.length < 2}
        className="min-w-0 max-w-full sm:max-w-56 text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-80"
        onChange={(e) => loadSheet(e.target.value)}
        value={selectedSheet}
      >
        {sheetNames.map((sheetName) => (
          <option key={sheetName} value={sheetName}>
            {sheetName}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SheetSelector;
