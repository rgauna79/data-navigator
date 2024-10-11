import axios from "axios";
import { VITE_BACKEND_URL } from "./config";

const instance = axios.create({
  baseURL: VITE_BACKEND_URL,
  withCredentials: true,
});

export default instance;
