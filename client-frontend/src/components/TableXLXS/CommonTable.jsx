import React from "react";
import TableComponent from "./Table.jsx";
import PaginationComponent from "./Pagination.jsx";
import SearchBar from "./SearchBar.jsx";
import Modal from "../reports/Modal.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

function CommonTable({
  columns,
  data,
  tableInstance,
  filter,
  selectedColumn,
  handleFilterChange,
  handleColumnSelectChange,
  handleOpenModal,
  handleCloseTable,
  showModal,
  handleCloseModal,
  saveData,
  showSaveButton = false,
  isSaving,
}) {
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

  React.useEffect(() => {
    const { column, input } = filter;
    if (column !== "") {
      setFilter(column, input);
    } else {
      tableInstance.setGlobalFilter(input);
    }
  }, [filter, setFilter, tableInstance]);

  return (
    <div className="flex-1 flex justify-center items-center bg-gray-500 flex-col mx-4 py-4">
      {data && (
        <>
          <SearchBar
            filter={filter}
            handleFilterChange={handleFilterChange}
            columns={columns}
            selectedColumn={selectedColumn}
            handleColumnSelectChange={handleColumnSelectChange}
          />
          <section id="buttonSection" className="flex justify-between w-full">
            {showModal && (
              <Modal
                handleClose={handleCloseModal}
                columns={columns}
                data={data}
              />
            )}
            <button
              id="saveDataButton"
              className="bg-blue-500 text-white p-2 rounded mt-4"
              onClick={handleOpenModal}
            >
              Generate Report
            </button>
            {showSaveButton && (
              <button
                id="saveDataButton"
                className="bg-blue-500 hover:bg-blue-700 text-white p-2 rounded mt-4"
                onClick={saveData}
              >
                {isSaving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span className="ml-2">Saving</span>
                  </>
                ) : (
                  "Save Data"
                )}
              </button>
            )}

            {handleCloseTable && (
              <button
                className="bg-blue-500 text-white p-2 rounded mt-4"
                onClick={handleCloseTable}
              >
                Close
              </button>
            )}
          </section>
          <section id="dataSection" className="mt-4 w-full">
            <div className="max-w-full overflow-x-auto">
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default CommonTable;
