import React from "react";

function TableComponent({
  getTableProps,
  getTableBodyProps,
  headerGroups,
  prepareRow,
  page,
}) {
  return (
    <table
      {...getTableProps()}
      className="table-auto w-full border-collapse text-sm"
    >
      <thead>
        {headerGroups.map((headerGroup) => {
          return (
            <tr key={headerGroup.headers[0].id}>
              {headerGroup.headers.map((column) => {
                const { key, ...headerProps } = column.getHeaderProps(
                  column.getSortByToggleProps()
                );
                return (
                  <th
                    key={key}
                    className="px-1 py-1 bg-blue-500 text-white border border-blue-500 whitespace-nowrap"
                    {...headerProps}
                  >
                    {column.render("Header")}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : ""}
                    </span>
                  </th>
                );
              })}
            </tr>
          );
        })}
      </thead>
      <tbody {...getTableBodyProps()}>
        {page.map((row, rowIndex) => {
          prepareRow(row);

          return (
            <tr key={row.id}>
              {row.cells.map((cell, cellIndex) => {
                return (
                  <td
                    key={`${row.id}-${cellIndex}`}
                    className="px-2 py-1 bg-white border border-gray-300 whitespace-nowrap"
                  >
                    {cell.value === "DAY" || cell.value === "NIGHT" ? (
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          cell.value === "DAY"
                            ? "bg-green-500 text-white"
                            : "bg-gray-800 text-white"
                        }`}
                      >
                        {cell.value}
                      </span>
                    ) : (
                      cell.render("Cell")
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TableComponent;
