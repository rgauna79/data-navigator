import { useNavigate } from "react-router-dom";
import { useExcelData } from "./useExcelData.js";

// Abre un archivo (File) en el lector desde cualquier página: datos de
// ejemplo, un archivo guardado... La lectura sigue en segundo plano y el
// lector muestra el progreso.
export const useOpenInReader = () => {
  const { handleFileChange } = useExcelData();
  const navigate = useNavigate();
  return (file) => {
    navigate("/filereader");
    return handleFileChange(file);
  };
};
