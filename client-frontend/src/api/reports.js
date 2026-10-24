import axios from "./axios.js";

// Lista de informes guardados (sin los datos)
export const listReports = () => axios.get("reports");

// Informe completo, con los datos para volver a abrirlo
export const getReport = (id) => axios.get(`reports/${id}`);

// report: { name, type, sheetName, selectedOptions, snapshot: { headers, data, config, columnTypes } }
export const saveReport = (report) => axios.post("reports", report);

export const deleteReport = (id) => axios.delete(`reports/${id}`);
