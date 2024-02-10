import React, { useMemo, useState, useEffect } from "react";
import { useReactTable } from "@tanstack/react-table";
import * as XLSX from "xlsx";

function FileExcelReader() {
  const [fileData, setFileData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [workbook, setWorkbook] = useState(null);

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

  // Set columns and data for table
  const columns = useMemo(
    () =>
      fileData
        ? Object.keys(fileData[0]).map((col) => ({
            Header: fileData[0][col],
            accessor: col,
          }))
        : [],
    [fileData],
  );
  console.log(columns);
  const data = useMemo(() => (fileData ? fileData.slice(1) : []), [fileData]);

  const tableInstance = useReactTable({ columns, data });

  return (
    <div className="flex-1 flex-col justify-center items-center bg-gray-500">
      <header id="headerContainer" className="text-center text-white">
        <h1>EXCEL READER</h1>
      </header>
      <section
        id="searchBox"
        className="container mx-auto sm:px-4 mt-4 border border-white p-6 rounded"
      >
        <div className="container row mb-2 input-group" id="inputContainer">
          <input
            type="file"
            className="form-control rounded"
            id="fileInput"
            aria-describedby="readFile"
            accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileChange}
          />
          <span className="text-center" id="loadingMessage"></span>
        </div>

        <div id="sheetLoaderContainer">
          <span className="d-flex text-start align-items-center">
            Select sheet to show:
          </span>
          <select
            name="sheetDropdown"
            id="sheetDropdown"
            className="p-2 rounded"
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

      <section id="dataSection" className="container mt-2 p-0">
        {fileData && (
          <table>
            {/* <table {...tableInstance.getTableProps()}> */}
            <thead>
              {tableInstance.getHeaderGroups().map((headerGroup) => (
                <tr key="{headerGroup.id}">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default FileExcelReader;
