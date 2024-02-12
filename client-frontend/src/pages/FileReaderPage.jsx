import React, { useMemo, useState, useEffect } from "react";
import { useGlobalFilter, useFilters, usePagination, useTable, useSortBy } from "react-table";
import * as XLSX from "xlsx";



function FileExcelReader() {
  const [fileData, setFileData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState(null);
  const [filterInput, setFilterInput] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");

  useEffect(() => {
    if (workbook && selectedSheet) {
      const sheet = workbook.Sheets[selectedSheet];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setFileData(json);      


    }
  }, [workbook, selectedSheet]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      setWorkbook(wb);
      const sheetNames = wb.SheetNames;
      setSelectedSheet(sheetNames[0]);
      const sheet = wb.Sheets[sheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      setFileData(json);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSheetChange = (e) => {
    setSelectedSheet(e.target.value);
  };





  const columns = useMemo(
    () =>
      fileData
        ? Object.keys(fileData[0]).map((col, index) => ({
            Header: fileData[0][col],
            accessor: col,
            id: `${col}`,
          }))
        : [],
    [fileData]
  );

  const data = useMemo(() => (fileData ? fileData.slice(1) : []), [fileData]);

  const tableInstance = useTable({ columns, data }, useFilters, useGlobalFilter, useSortBy, usePagination, );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    setFilter,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    nextPage,
    previousPage,
    state: { pageIndex, preGlobalFilteredRows, globalFilter },
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

  return (
    <div className="flex-1 flex-col justify-center items-center bg-gray-500 p-4">
      <header id="headerContainer" className="text-center text-white mb-4">
        <h1>EXCEL READER</h1>
      </header>
      <section id="searchBox" className="border border-white p-4 rounded w-full bg-white">
        <div className="mb-2 flex items-center">
          <input
            type="file"
            className="form-control rounded mr-2"
            id="fileInput"
            aria-describedby="readFile"
            accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
          />
          <span className="text-center" id="loadingMessage"></span>
        </div>

        <div className="flex items-center">
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
      </section>
      {fileData && (
        <section
          id="searchBar"
          className="mt-4 p-4 w-full bg-white rounded flex flex-wrap items-center justify-between"
        >
          <input
            value={filterInput}
            onChange={handleFilterChange}
            placeholder="Search in all columns"
            className="p-2 rounded border-gray-300 border w-full md:w-auto mb-2 md:mb-0"
          />
          <select
            value={selectedColumn}
            onChange={handleColumnSelectChange}
            className="p-2 rounded border-gray-300 border w-full md:w-auto"
          >
            <option value="">All columns</option>
            {columns.map((column) => (
              <option key={column.id} value={column.accessor}>
                {column.Header}
              </option>
            ))}
          </select>
        </section>
      )}
      <section id="dataSection" className="mt-4 w-full">
        <div className="max-w-full overflow-x-auto">
          {fileData && (
            <>
              <table {...getTableProps()} className="table-auto w-full border-collapse">
                <thead>
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="px-1 py-1 bg-blue-500 text-white border border-blue-500"
                          id={column.id} 
                        >
                          {column.render("Header")}
                          <span>
                            {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row, i) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()} key={i}>
                        {row.cells.map((cell) => (
                          <td
                            {...cell.getCellProps()}
                            className="px-4 py-1 bg-white border border-gray-300"
                          >
                            {cell.render("Cell")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pagination mt-4">
                <button
                  className="px-3 py-1 mr-2 bg-blue-500 text-white rounded"
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  {"<"}
                </button>
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  {">"}
                </button>
                <span className="ml-2">
                  Página{" "}
                  <strong>
                    {pageIndex + 1} de {pageOptions.length}
                  </strong>{" "}
                </span>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default FileExcelReader;
