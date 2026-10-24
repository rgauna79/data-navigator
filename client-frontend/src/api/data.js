import axios from "./axios";

// overwrite: confirma que se reemplaza un archivo guardado con el mismo nombre
export const saveData = ({ sheetName, fileData, overwrite = false }) =>
  axios.post(`data/saveData`, { sheetName, fileData, overwrite });

// Lista de archivos guardados (solo metadatos)
export const listSavedFiles = () => axios.get(`data/savedfiles`);

export const getSavedFile = (id) => axios.get(`data/savedfiles/${id}`);

export const renameSavedFile = (id, sheetName) =>
  axios.patch(`data/savedfiles/${id}`, { sheetName });

export const deleteSavedFile = (id) => axios.delete(`data/savedfiles/${id}`);
