import { useState, useMemo, useEffect } from "react";
import {
  useTable,
  usePagination,
  useFilters,
  useGlobalFilter,
  useSortBy,
} from "react-table";
import CommonTable from "./CommonTable.jsx";
import * as XLSX from "xlsx";

function DataTable({ workbook, selectedSheet, isLoggedIn, sheetSaved }) {
  const [fileData, setFileData] = useState([]);

  const formatJson = (json) => {
    return json.map((row) =>
      row.map((cell) =>
        typeof cell === "string" ? cell.trim().toUpperCase() : cell
      )
    );
  };

  useEffect(() => {
    if (sheetSaved) {
      setFileData(formatJson(sheetSaved));
      return;
    }
    const sheet = workbook.Sheets[selectedSheet];
    const json = XLSX.utils.sheet_to_json(sheet, { raw: false, header: 1 });
    setFileData(formatJson(json));
  }, [workbook, selectedSheet, sheetSaved]);

  const columns = useMemo(() => {
    if (!fileData || fileData.length === 0) return [];
    return Object.keys(fileData[0]).map((col) => ({
      Header: fileData[0][col],
      accessor: col,
      sortType: typeof fileData[1][col] === "number" ? "basic" : "alphanumeric",
    }));
  }, [fileData]);

  const data = useMemo(() => {
    if (!fileData) {
      return [];
    }
    return fileData
      .slice(1)
      .filter((row) => Object.values(row).some((cell) => cell !== ""));
  }, [fileData]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageSize: 15 } },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  return (
    <CommonTable
      table={tableInstance}
      data={data}
      isLoggedIn={isLoggedIn}
      columns={columns}
    />
  );
}

export default DataTable;
