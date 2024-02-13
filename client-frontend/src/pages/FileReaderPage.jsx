import React, { useMemo, useState, useEffect } from "react";
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

function FileExcelReader() {
  // State variables
  const [fileData, setFileData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState(null);
  const [filterInput, setFilterInput] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Effect to update fileData when workbook or selectedSheet is changed
  useEffect(() => {
    if (workbook && selectedSheet) {
      const sheet = workbook.Sheets[selectedSheet];
      const json = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 });

      setFileData(json);
    }
  }, [workbook, selectedSheet]);

  // Function to
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (!file.name.endsWith(".xlsx")) {
      alert("Please select an xlsx file");
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
        const json = XLSX.utils.sheet_to_json(sheet, {
          headers: 1,
          raw: false,
        });
        setFileData(json);
      } catch (error) {
        console.error("Error while reading file:", error);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Function
  const handleSheetChange = (e) => {
    setSelectedSheet(e.target.value);
  };

  // Memoized columns
  const columns = useMemo(
    () =>
      fileData
        ? Object.keys(fileData[0]).map((col, index) => ({
            Header: fileData[0][col],
            accessor: col,
            id: `${col}`,
          }))
        : [],
    [fileData],
  );

  // Memoized data
  const data = useMemo(() => {
    if (!fileData) {
      return [];
    }
    const filteredData = fileData.filter((row) => {
      return Object.values(row).some((cell) => cell !== "");
    });
    return filteredData.slice(1);
  }, [fileData]);

  // Table instance
  const tableInstance = useTable(
    { columns, data, initialState: { pageSize: 15 } },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination,
  );

  // Destructuring tableInstance properties
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

  // Effect to set filter
  useEffect(() => {
    if (selectedColumn !== "") {
      setFilter(selectedColumn, filterInput);
    } else {
      tableInstance.setGlobalFilter(filterInput);
    }
  }, [selectedColumn, filterInput, setFilter]);

  // function to handle filter change
  const handleFilterChange = (e) => {
    const value = e.target.value || "";
    setFilterInput(value);
  };

  // function to handle column select
  const handleColumnSelectChange = (e) => {
    setSelectedColumn(e.target.value);
  };

  // function to handle modal
  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // Render component
  return (
    <div className="flex-1 flex-col justify-center items-center bg-gray-500 p-4">
      <header id="headerContainer" className="text-center text-white mb-4">
        <h1>EXCEL READER</h1>
      </header>
      <section
        id="searchBox"
        className="border border-white p-4 rounded w-full bg-white"
      >
        <FileInputComponent handleFileChange={handleFileChange} />
        <SheetSelect
          fileData={fileData}
          workbook={workbook}
          selectedSheet={selectedSheet}
          handleSheetChange={handleSheetChange}
        />
      </section>
      {fileData && (
        <SearchBar
          filterInput={filterInput}
          handleFilterChange={handleFilterChange}
          columns={columns}
          selectedColumn={selectedColumn}
          handleColumnSelectChange={handleColumnSelectChange}
        />
      )}
      <button
        id="openModalButton"
        className="bg-blue-500 text-white p-2 rounded mt-4"
        onClick={handleOpenModal}
      >
        Generate Report
      </button>

      {showModal && (
        <Modal handleClose={handleCloseModal} columns={columns} data={data} />
      )}
      <section id="dataSection" className="mt-4 w-full">
        <div className="max-w-full overflow-x-auto">
          {fileData && (
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
                pageIndex={pageIndex}
                pageSize={pageSize}
                data={data}
                canPreviousPage={canPreviousPage}
                canNextPage={canNextPage}
                pageOptions={pageOptions}
                pageCount={pageCount}
                nextPage={nextPage}
                previousPage={previousPage}
                setPageSize={setPageSize}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default FileExcelReader;
