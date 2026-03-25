// context/ReportContext.jsx
// ✅ Maneja reportes, datos guardados y opciones de configuración de reportes
import React, { createContext, useContext, useState } from "react";
import { saveData, readData } from "../api/data.js";

const ReportContext = createContext();

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context) throw new Error("useReportContext must be used within ReportProvider");
  return context;
};

export const ReportProvider = ({ children }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [typeReport, setTypeReport] = useState("");
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [dataSaved, setDataSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const handleSaveData = async (dataToSave) => {
    setIsSaving(true);
    setError(null);
    try {
      await saveData(dataToSave);
    } catch (err) {
      setError(err);
      throw err; // re-throw para que CommonTable pueda mostrar el error
    } finally {
      setIsSaving(false);
    }
  };

  const readAllData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const dataFound = await readData();
      setDataSaved(dataFound);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <ReportContext.Provider
      value={{
        selectedOptions,
        setSelectedOptions,
        typeReport,
        setTypeReport,
        data,
        setData,
        error,
        dataSaved,
        isSaving,
        isLoadingData,
        handleSaveData,
        readAllData,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};