import React, { createContext, useContext, useState } from "react";
import { saveData, readData } from "../api/data.js";

const DataContext = createContext();

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // const [isLoading, setIsLoading] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [typeReport, setTypeReport] = useState("");
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [dataSaved, setDataSaved] = useState();
  const [workbook, setWorkbook] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [fileData, setFileData] = useState([]);
  const [filter, setFilter] = useState({
    input: "",
    column: "",
  });

  const handleSaveData = async (data) => {
    // setIsLoading(true);
    try {
      await saveData(data);
    } catch (error) {
      setError(error);
    } finally {
      // setIsLoading(false);
    }
  };

  const readAllData = async () => {
    try {
      const dataFound = await readData();
      setDataSaved(dataFound);
    } catch (error) {}
  };

  return (
    <DataContext.Provider
      value={{
        error,
        dataSaved,
        workbook,
        selectedSheet,
        fileData,
        selectedColumns,
        setSelectedColumns,
        selectedOptions,
        setSelectedOptions,
        typeReport,
        setTypeReport,
        data,
        setData,
        setWorkbook,
        setSelectedSheet,
        setFileData,
        handleSaveData,
        readAllData,
        filter,
        setFilter,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
