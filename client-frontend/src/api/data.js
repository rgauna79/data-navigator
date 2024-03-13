import axios from "./axios";

export const saveData = (data) => axios.post(`data/saveData`, data);

export const readData = () => axios.get(`data/savedfiles`);
