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
import SearchBar from "../components/TableXLXS/SearchBar.jsx";
import TableComponent from "../components/TableXLXS/Table.jsx";
import PaginationComponent from "../components/TableXLXS/Pagination.jsx";
import Modal from "../components/Modal.jsx";
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

  const [filterInput, setFilterInput] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { isLoggedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (workbook && selectedSheet) {
      const sheet = workbook.Sheets[selectedSheet];
      const json = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 });
      setFileData(json);
    }
  }, [workbook, selectedSheet, setFileData]);

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
        setFileData(json);
      } catch (error) {
        console.error("Error while reading file:", error);
      }
      setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };

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

  const data = useMemo(() => {
    if (!fileData) {
      return [];
    }
    return fileData
      .slice(1)
      .filter((row) => Object.values(row).some((cell) => cell !== ""));
  }, [fileData]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageSize: 15 } },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    setFilter,
    setPageSize,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    nextPage,
    previousPage,
    state: { pageIndex, pageSize },
  } = tableInstance;

  useEffect(() => {
    if (selectedColumn !== "") {
      setFilter(selectedColumn, filterInput);
    } else {
      tableInstance.setGlobalFilter(filterInput);
    }
  }, [selectedColumn, filterInput, setFilter]);

  const handleFilterChange = (e) => {
    const value = e.target.value || "";
    setFilterInput(value);
  };

  const handleColumnSelectChange = (e) => {
    setSelectedColumn(e.target.value);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleSaveDataClick = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
      setIsLoading(false);
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
      {fileData && workbook && (
        <>
          <SearchBar
            filterInput={filterInput}
            handleFilterChange={handleFilterChange}
            columns={columns}
            selectedColumn={selectedColumn}
            handleColumnSelectChange={handleColumnSelectChange}
          />
          <section
            id="buttonSection"
            className="flex justify-between mt-2 w-full"
          >
            <button
              id="openModalButton"
              className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded mt-4"
              onClick={handleOpenModal}
            >
              Generate Report
            </button>
            {isLoggedIn && (
              <button
                id="saveDataButton"
                className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded mt-4"
                onClick={handleSaveDataClick}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span className="ml-2">Saving</span>
                  </>
                ) : (
                  "Save Data"
                )}
              </button>
            )}
            {showModal && (
              <Modal
                handleClose={handleCloseModal}
                columns={columns}
                data={data}
                workbook={workbook}
                selectedSheet={selectedSheet}
              />
            )}
          </section>
        </>
      )}
      <section id="dataSection" className="mt-4 w-full">
        <div className="max-w-full overflow-x-auto">
          {fileData && workbook && (
            <>
              <TableComponent
                getTableProps={getTableProps}
                getTableBodyProps={getTableBodyProps}
                headerGroups={headerGroups}
                prepareRow={prepareRow}
                page={page}
                columns={columns}
              />
              <PaginationComponent
                canPreviousPage={canPreviousPage}
                previousPage={previousPage}
                pageOptions={pageOptions}
                pageIndex={pageIndex}
                canNextPage={canNextPage}
                nextPage={nextPage}
                pageCount={pageCount}
                setPageSize={setPageSize}
                pageSize={pageSize}
                data={data}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default FileExcelReader;
