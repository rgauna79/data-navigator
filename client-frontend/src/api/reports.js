import axios from "./axios.js"; // reutiliza la instancia axios existente

export const getReportsRequest   = ()         => axios.get("/reports");
export const getReportByIdRequest = (id)      => axios.get(`/reports/${id}`);
export const saveReportRequest    = (data)    => axios.post("/reports", data);
export const deleteReportRequest  = (id)      => axios.delete(`/reports/${id}`);