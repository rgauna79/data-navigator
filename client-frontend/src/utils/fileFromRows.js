// Convierte filas (por ejemplo, un archivo guardado) en un CSV para abrirlo
// en el lector como si fuera un archivo subido por el usuario.
import { toCsv } from "./reportUtils.js";

export const fileFromRows = (name, rows) => {
  const safeName = String(name || "data").replace(/[\\/:*?"<>|]/g, " ").trim() || "data";
  return new File([toCsv(rows)], `${safeName}.csv`, { type: "text/csv" });
};
