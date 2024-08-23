import React, { useState, useEffect, useMemo } from "react";
import { useDataContext } from "../context/DataContext";
import CommonTable from "../components/TableXLXS/CommonTable.jsx";
import {
  useGlobalFilter,
  useFilters,
  usePagination,
  useTable,
  useSortBy,
} from "react-table";

function DbSheetPage() {
  const { readAllData, dataSaved, isLoading, error } = useDataContext();
  const [table, setTable] = useState();
  const [filter, setFilters] = useState({ input: "", column: "" });
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
              <div
                className="flex justify-between border items-center"
                key={index}
              >
                <p className="px-4">{item.sheetName}</p>
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
      ></section>

      <section id="dataSection" className="mt-4 w-full">
        <div className="max-w-full overflow-x-auto">
          {table && (
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
              handleCloseTable={handleCloseTable}
              showModal={showModal}
              handleCloseModal={handleCloseModal}
            />
          )}
        </div>
      </section>
    </div>
  );
}

export default DbSheetPage;
