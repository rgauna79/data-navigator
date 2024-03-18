import React from "react";

function SheetSelect({ fileData, workbook, selectedSheet, handleSheetChange }) {
  return (
    <div className="flex items-center mt-4 justify-center">
      <span className="mr-2 w-full md:w-auto">Select sheet to show:</span>
      <select
        name="sheetDropdown"
        id="sheetDropdown"
        className="p-2 rounded border-gray-300 border w-full md:w-auto"
        onChange={handleSheetChange}
        value={selectedSheet}
      >
        {fileData &&
          workbook.SheetNames.map((sheetName) => (
            <option key={sheetName} value={sheetName}>
              {sheetName}
            </option>
          ))}
      </select>
    </div>
  );
}

export default SheetSelect;
