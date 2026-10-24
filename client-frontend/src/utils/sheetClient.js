// Cliente del Web Worker que lee los archivos (ver sheetService.js).
// Si el Worker no está disponible o falla al cargar, las mismas operaciones
// se ejecutan en el hilo principal.
let worker;
let nextId = 0;
const pending = new Map();
let fallbackService;

const rejectAll = (error) => {
  pending.forEach(({ reject }) => reject(error));
  pending.clear();
};

const getWorker = () => {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL("../workers/sheet.worker.js", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }) => {
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      if (data.error) request.reject(new Error(data.error));
      else request.resolve(data.result);
    };
    worker.onerror = (event) => {
      // El Worker no pudo cargarse o falló: se usa el hilo principal desde ahora
      event.preventDefault?.();
      worker.terminate();
      worker = null;
      rejectAll(new Error("worker-failed"));
    };
  } catch {
    worker = null;
  }
  return worker;
};

const callFallback = async (type, payload) => {
  fallbackService ??= (await import("./sheetService.js")).createSheetService();
  return fallbackService[type](payload);
};

const call = (type, payload) => {
  const w = getWorker();
  if (!w) return callFallback(type, payload);
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    // El buffer se copia (no se transfiere) para poder reintentar si el Worker falla
    w.postMessage({ id, type, payload });
  }).catch((error) => {
    // Si el Worker falló antes de responder, se reintenta en el hilo principal
    if (error.message === "worker-failed") return callFallback(type, payload);
    throw error;
  });
};

// buffer: ArrayBuffer del archivo
export const openSheetFile = (buffer, name, preferredSheet) =>
  call("open", { buffer, name, preferredSheet });

export const loadSheetRows = (sheetName) => call("sheet", { sheetName });

export const closeSheetFile = () => call("close", {});
