// Persistencia local (IndexedDB) del trabajo en curso para que sobreviva a
// una recarga de la página: el archivo Excel abierto y el último informe.
// IndexedDB guarda Blobs y Dates de forma nativa, sin serializar a JSON.
// Si IndexedDB no está disponible (modo privado, tests) las funciones no hacen nada.

const DB_NAME = "data-navigator";
const STORE = "session";

let dbPromise = null;

const openDb = () => {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }
  return dbPromise;
};

const run = async (mode, action) => {
  try {
    const db = await openDb();
    if (!db) return undefined;
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Session storage error:", error);
    return undefined;
  }
};

export const loadSession = (key) => run("readonly", (store) => store.get(key));

export const saveSession = (key, value) =>
  run("readwrite", (store) => store.put(value, key));

// Actualiza solo algunos campos de un registro existente
export const updateSession = async (key, changes) => {
  const current = await loadSession(key);
  if (current) await saveSession(key, { ...current, ...changes });
};

export const clearSession = (key) =>
  run("readwrite", (store) => (key ? store.delete(key) : store.clear()));
