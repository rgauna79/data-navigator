import React, { useState, useEffect, useMemo } from "react";
import { useDataContext } from "../context/DataContext";
import TableComponent from "../components/TableXLXS/Table.jsx";
import FileInputComponent from "../components/TableXLXS/FileInput.jsx";
import SearchBar from "../components/TableXLXS/SearchBar.jsx";
import PaginationComponent from "../components/TableXLXS/Pagination.jsx";
import {
    useGlobalFilter,
    useFilters,
    usePagination,
    useTable,
    useSortBy,
  } from "react-table";
  import Modal from "../components/Modal.jsx";

function DbSheetPage() {
  const { readAllData, dataSaved, isLoading, error } = useDataContext();
  const [table, setTable] = useState();
  const [selectedColumn, setSelectedColumn] = useState("");
  const [filterInput, setFilterInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  

  useEffect(() => {
    readAllData();
  }, []);

  const handleViewTable = (index) => {
    setTable(dataSaved.data[index].fileData);
  };

  function handleCloseTable() {
    setTable("");
  }

  // Memoized columns
  const columns = useMemo(
    () =>
      table
        ? Object.keys(table[0]).map((col, index) => ({
            Header: table[0][col],
            accessor: col,
            id: `${col}`,
          }))
        : [],
    [table]
  );

  // Memoized data
  const data = useMemo(() => {
    if (!table) {
      return [];
    }
    const filteredData = table.filter((row) => {
      return Object.values(row).some((cell) => cell !== "");
    });
    return filteredData.slice(1);
  }, [table]);

  // Table instance

  const tableInstance = useTable(
    { columns, data, initialState: { pageSize: 15 } },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
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

  return (
    <div className="flex-1 flex justify-center items-center bg-gray-500 flex-col mx-4 py-4">
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      <section className="border border-white p-4 rounded w-full bg-white ">
        <h2>Sheet Saveds</h2>
        {dataSaved && (
          <div className="mt-2">
            {dataSaved.data.map((item, index) => (
              <div className="flex justify-between border items-center" key={index}>
                <p className="px-4">
                  {item.sheetName}
                </p>
                <button
                  className="bg-blue-500 text-white p-2 rounded"
                  onClick={() => handleViewTable(index)}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <section
        id="searchBox"
        className="border border-white p-4 rounded w-full bg-white"
      >
        
      </section>
      {table && (
        <SearchBar
          filterInput={filterInput}
          handleFilterChange={handleFilterChange}
          columns={columns}
          selectedColumn={selectedColumn}
          handleColumnSelectChange={handleColumnSelectChange}
        />
      )}
      <section id="buttonSection" className="flex justify-between  w-full">
        

        {showModal && (
          <Modal
            handleClose={handleCloseModal}
            columns={columns}
            data={data}
            
           
          />
        )}
      </section>
      <section id="dataSection" className="mt-4 w-full">
        <div className="max-w-full overflow-x-auto">
          {table && (
            <>
            <div className="flex w-full justify-between mt-2 mb-2">
            <button
          id="openModalButton"
          className="bg-blue-500 text-white p-2 rounded "
          onClick={handleOpenModal}
        >
          Generate Report
        </button>
            <button className="bg-blue-500 text-white p-2 rounded "
                onClick={handleCloseTable}>Close</button>
                </div>
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

export default DbSheetPage;
