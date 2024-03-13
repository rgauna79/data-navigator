import React from "react";

function SearchBar({
  filterInput,
  handleFilterChange,
  columns,
  selectedColumn,
  handleColumnSelectChange,
}) {
  return (
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
  );
}

export default SearchBar;
