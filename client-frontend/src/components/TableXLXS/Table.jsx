import React from "react";

function TableComponent({
  getTableProps,
  getTableBodyProps,
  headerGroups,
  prepareRow,
  page,
  columns,
}) {
  return (
    <table
      {...getTableProps()}
      className="table-auto w-full border-collapse text-sm "
    >
      <thead>
        {headerGroups.map((headerGroup, index) => (
          <tr key={index} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, columnIndex) => (
              <th
                key={column.id}
                {...column.getHeaderProps(column.getSortByToggleProps())}
                className="px-1 py-1 bg-blue-500 text-white border border-blue-500 whitespace-nowrap"
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
        {page.map((row, rowIndex) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()} key={rowIndex}>
              {row.cells.map((cell) => (
                <td
                  key={cell.column.id}
                  {...cell.getCellProps()}
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
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TableComponent;
