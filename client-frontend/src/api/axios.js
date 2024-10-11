import axios from "axios";
import { VITE_BACKEND_URL } from "./config";

const instance = axios.create({
  baseURL: "https://7mhxp9-3000.csb.app/api",
  withCredentials: true,
});

export default instance;
