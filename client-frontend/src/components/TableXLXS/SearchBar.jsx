import React, { useEffect } from "react";
import { useDataContext } from "../../context/DataContext";

function SearchBar({ columns, table }) {
  const { filter, setFilter } = useDataContext();

  useEffect(() => {
    const { column, input } = filter;
    if (column !== "") {
      setFilter(column, input);
    } else {
      table.setGlobalFilter(input);
    }
  }, [filter, setFilter, table]);

  return (
    <section
      id="searchBar"
      className="mt-4 p-4 w-full bg-white rounded flex flex-wrap items-center justify-between"
    >
      <input
        value={filter.input}
        onChange={(e) => setFilter({ ...filter, input: e.target.value })}
        placeholder="Search in all columns"
        className="p-2 rounded border-gray-300 border w-full md:w-auto mb-2 md:mb-0"
      />
      <select
        value={filter.column}
        onChange={(e) => setFilter({ ...filter, column: e.target.value })}
        className="p-2 rounded border-gray-300 border w-full md:w-auto"
      >
        <option value="">All columns</option>
        {columns.map((column) => (
          <option key={column.accessor} value={column.accessor}>
            {column.Header}
          </option>
        ))}
      </select>
    </section>
  );
}

export default SearchBar;
