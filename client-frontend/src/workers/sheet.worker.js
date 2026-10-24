import { createSheetService } from "../utils/sheetService.js";

// Web Worker: lee y procesa el archivo fuera del hilo principal.
// Mensajes: { id, type: "open" | "sheet" | "close", payload } -> { id, result | error }
const service = createSheetService();

self.onmessage = ({ data: { id, type, payload } }) => {
  try {
    self.postMessage({ id, result: service[type](payload) });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
};
