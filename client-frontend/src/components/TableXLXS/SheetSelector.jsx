import { useDataContext } from "../../context/DataContext";
import { useExcelData } from "../../hooks/useExcelData.js";

function SheetSelector() {
  const { sheetNames, selectedSheet } = useDataContext();
  const { loadSheet } = useExcelData();

  if (sheetNames.length === 0) return null;

  const handleSheetChange = (e) => {
    loadSheet(e.target.value);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center">
      <label htmlFor="sheetDropdown" className="text-sm text-gray-700 dark:text-gray-300">
        Select sheet to show:
      </label>
      <select
        name="sheetDropdown"
        id="sheetDropdown"
        className="w-full sm:w-auto text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        onChange={handleSheetChange}
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
