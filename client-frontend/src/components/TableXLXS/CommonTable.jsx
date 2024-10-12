import React, { useState } from "react";
import TableComponent from "./Table.jsx";
import PaginationComponent from "./Pagination.jsx";
import SearchBar from "./SearchBar.jsx";
import Modal from "../reports/Modal.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

function CommonTable({
  columns,
  data,
  table,
  handleCloseTable,
  handleSaveData,
  showSaveButton = false,
}) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    setPageSize,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    nextPage,
    previousPage,
    state: { pageIndex, pageSize },
  } = table;

  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

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
    <div className="flex-1 flex justify-center items-center bg-gray-500 flex-col mx-4 py-4">
      {data && (
        <>
          <SearchBar table={table} columns={columns} />
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
                onClick={handleSaveDataClick}
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
                table={table}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default CommonTable;
