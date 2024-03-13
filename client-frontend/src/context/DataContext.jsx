import React, { createContext, useContext, useState } from "react";
import { saveData, readData } from "../api/data.js";

const DataContext = createContext();

export const useDataContext = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataSaved, setDataSaved] = useState();  

  const handleSaveData = async (data) => {
    setIsLoading(true);
    try {
      await saveData(data);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const readAllData = async () => {
    try {
      const dataFound =  await readData();
      setDataSaved(dataFound);
    } catch (error) {
      
    }
  }

  return (
    <DataContext.Provider value={{ isLoading, error, dataSaved,  handleSaveData, readAllData }}>
      {children}
    </DataContext.Provider>
  );
};
