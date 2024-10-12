import React from "react";
import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext";
import DataTable from "../components/TableXLXS/DataTable.jsx";

import FileInput from "../components/TableXLXS/FileInput.jsx";
import SheetSelector from "../components/TableXLXS/SheetSelector.jsx";

function FileExcelReader() {
  const { workbook, selectedSheet, fileData, handleSaveData } =
    useDataContext();

  const { isLoggedIn } = useAuth();

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-gray-500 p-4 text-black mx-4 py-4">
      <header id="headerContainer" className="text-center text-white mb-4">
        <h1>EXCEL READER</h1>
      </header>
      <section
        id="searchBox"
        className="border border-white p-4 rounded lg:w-1/2 sm:w-full md:w-full bg-white text-black"
      >
        <FileInput />
        {fileData && workbook && <SheetSelector />}
      </section>

      <section id="dataSection" className="mt-4 w-full">
        <div className="max-w-full overflow-x-auto">
          {selectedSheet && (
            <DataTable
              workbook={workbook}
              selectedSheet={selectedSheet}
              isLoggedIn={isLoggedIn}
              handleSaveData={handleSaveData}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default FileExcelReader;
