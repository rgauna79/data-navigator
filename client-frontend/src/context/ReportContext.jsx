import React, { createContext, useContext, useState } from "react";
import { saveData, readData } from "../api/data.js";
import {
  getReportsRequest,
  saveReportRequest,
  deleteReportRequest,
} from "../api/reports.js";

const ReportContext = createContext();

export const useReportContext = () => {
  const context = useContext(ReportContext);
  if (!context)
    throw new Error("useReportContext must be used within ReportProvider");
  return context;
};

export const ReportProvider = ({ children }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [typeReport, setTypeReport] = useState("");
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [dataSaved, setDataSaved] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reportError, setReportError] = useState(null);

  // ✅ nuevo: resetSaveStatus no necesita estado propio — se maneja en FileReaderPage
  // pero lo exponemos como no-op para compatibilidad
  const resetSaveStatus = () => {};

  const handleSaveData = async ({ sheetName, fileData, overwrite = false }) => {
    setIsSaving(true);
    setError(null);
    try {
      // ✅ Pasar overwrite al backend
      await saveData({ sheetName, fileData, overwrite });
      // Refrescar lista de sheets guardadas
      await readAllData();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const readAllData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const response = await readData();
      const raw = response.data;
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : [];
      setDataSaved(arr);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchSavedReports = async () => {
    setIsLoadingReports(true);
    setReportError(null);
    try {
      const res = await getReportsRequest();
      setSavedReports(res.data);
    } catch (err) {
      setReportError(err?.response?.data?.message || "Failed to load reports");
    } finally {
      setIsLoadingReports(false);
    }
  };

  const saveReport = async (reportData) => {
    try {
      await saveReportRequest(reportData);
      await fetchSavedReports();
    } catch (err) {
      throw new Error(err?.response?.data?.message || "Failed to save report");
    }
  };

  const deleteReport = async (id) => {
    try {
      await deleteReportRequest(id);
      setSavedReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      throw new Error(
        err?.response?.data?.message || "Failed to delete report"
      );
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
        resetSaveStatus,
        savedReports,
        isLoadingReports,
        reportError,
        fetchSavedReports,
        saveReport,
        deleteReport,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};
