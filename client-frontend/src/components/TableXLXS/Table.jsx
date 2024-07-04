import React from "react";

function TableComponent({
  getTableProps,
  getTableBodyProps,
  headerGroups,
  prepareRow,
  page,
}) {
  // Agregar console.log para imprimir los valores
  // console.log("headerGroups:", headerGroups);

  return (
    <table
      {...getTableProps()}
      className="table-auto w-full border-collapse text-sm"
    >
      <thead>
        {headerGroups.map((headerGroup) => {
          // Agregar console.log para imprimir headerGroup.id
          // console.log("headerGroup.id:", headerGroup.headers[0].id);

          return (
            <tr key={headerGroup.headers[0].id} >
              {headerGroup.headers.map((column) => {
                // Agregar console.log para imprimir column.id
                // console.log("column.id:", column.id);

                return (
                  <th
                    key={column.id}
                    
                    className="px-1 py-1 bg-blue-500 text-white border border-blue-500 whitespace-nowrap"
                    id={column.id}
                  >
                    {column.render("Header")}
                    <span>
                      {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
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
          // Agregar console.log para imprimir row.id
          // console.log("row.id:", row.id);

          return (
            <tr key={row.id}>
              {row.cells.map((cell, cellIndex) => {
                // Agregar console.log para imprimir cellIndex
                // console.log("cellIndex:", cellIndex);

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
