import React, { useMemo, useState, useEffect } from "react";
import { useDataContext } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext";
import {
  useGlobalFilter,
  useFilters,
  usePagination,
  useTable,
  useSortBy,
} from "react-table";
import * as XLSX from "xlsx";
import FileInputComponent from "../components/TableXLXS/FileInput.jsx";
import SheetSelect from "../components/TableXLXS/SheetSelect.jsx";
import CommonTable from "../components/TableXLXS/CommonTable.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

function FileExcelReader() {
  const {
    workbook,
    selectedSheet,
    fileData,
    setWorkbook,
    setSelectedSheet,
    setFileData,
    handleSaveData,
  } = useDataContext();

  // State for managing filter input and selected column
  const [filter, setFilters] = useState({ input: "", column: "" });
  // State to manage the visibility of the modal
  const [showModal, setShowModal] = useState(false);
  // Authentication status
  const { isLoggedIn } = useAuth();
  // State for managing loading and saving status
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Function to format JSON data
  const formatJson = (json) => {
    return json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );
  };

  // Effect to update fileData when workbook or selectedSheet changes
  useEffect(() => {
    if (workbook && selectedSheet) {
      const sheet = workbook.Sheets[selectedSheet];
      const json = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 });
      setFileData(formatJson(json));
    }
  }, [workbook, selectedSheet, setFileData]);

  // Function to handle file input change
  const handleFileChange = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const file = e.target.files[0];
    if (!file) {
      setIsLoading(false);
      return;
    }
    if (!file.name.endsWith(".xlsx")) {
      alert("Please select an xlsx file");
      setIsLoading(false);
      return;
    }
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        setWorkbook(wb);
        const sheetNames = wb.SheetNames;
        setSelectedSheet(sheetNames[0]);
        const sheet = wb.Sheets[sheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

        setFileData(formatJson(json));
      } catch (error) {
        console.error("Error while reading file:", error);
      }
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  // Memoized columns based on fileData
  const columns = useMemo(() => {
    if (!fileData || fileData.length === 0 || !fileData[0]) {
      return [];
    }
    return Object.keys(fileData[0]).map((col, index) => ({
      Header: fileData[0][col],
      accessor: col,
      id: `${col}`,
    }));
  }, [fileData]);

  // Memoized data for the table
  const data = useMemo(() => {
    if (!fileData) {
      return [];
    }
    return fileData
      .slice(1)
      .filter((row) => Object.values(row).some((cell) => cell !== ""));
  }, [fileData]);

  // Initialize table instance with react-table hooks
  const tableInstance = useTable(
    { columns, data, initialState: { pageSize: 15 } },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  // Function to open the modal
  const handleOpenModal = () => {
    setShowModal(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Function to handle saving data
  const handleSaveDataClick = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const dataToSave = {
        sheetName: selectedSheet,
        fileData,
      };
      await handleSaveData(dataToSave);
      alert(`${dataToSave.sheetName} saved successfully in the database`);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-gray-500 p-4 text-black mx-4 py-4">
      <header id="headerContainer" className="text-center text-white mb-4">
        <h1>EXCEL READER</h1>
      </header>
      <section
        id="searchBox"
        className="border border-white p-4 rounded lg:w-1/2 sm:w-full md:w-full bg-white text-black"
      >
        <FileInputComponent handleFileChange={handleFileChange} />
        {isLoading && (
          <div className="flex items-center mt-4 justify-center">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span className="ml-2">Loading</span>
          </div>
        )}
        {fileData && workbook && (
          <SheetSelect workbook={workbook} selectedSheet={selectedSheet} />
        )}
      </section>

      <section id="dataSection" className="mt-4 w-full">
        <div className="max-w-full overflow-x-auto">
          {fileData && workbook && (
            <CommonTable
              columns={columns}
              data={data}
              tableInstance={tableInstance}
              filter={filter}
              handleFilterChange={(e) =>
                setFilters({ ...filter, input: e.target.value })
              }
              handleColumnSelectChange={(e) =>
                setFilters({ ...filter, column: e.target.value })
              }
              handleOpenModal={handleOpenModal}
              handleCloseTable={false} // Placeholder; not used
              showModal={showModal}
              handleCloseModal={handleCloseModal}
              showSaveButton={isLoggedIn}
              saveData={handleSaveDataClick}
              isSaving={isSaving}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default FileExcelReader;
