// Orden de las columnas de la tabla (TanStack Table) según su tipo:
// números por valor ("1.200" > "950" en una columna en español), fechas por
// fecha ("15/01/2024" antes que "03/02/2024" en una columna día/mes) y texto
// alfabético sin distinguir mayúsculas ni acentos ("item 2" antes que "item 10").
import { parseDate, toNumber } from "./excelUtils.js";

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/**
 * Crea la función de orden de la tabla.
 * typeOf(columnId): { type, decimal?, dateOrder? } de la columna.
 * isDesc(columnId): si la columna se ordena de mayor a menor. TanStack
 *   invierte el resultado al ordenar al revés; con esto los vacíos (y los
 *   valores que no se pueden leer como número o fecha) quedan siempre al final.
 * La conversión de cada valor se guarda en caché: ordenar compara cada valor
 * muchas veces. Hay que crear un sorter nuevo cuando cambian los datos.
 */
export const createSorter = ({ typeOf, isDesc = () => false }) => {
  const caches = new Map();

  const keyOf = (value, columnId) => {
    let cache = caches.get(columnId);
    if (!cache) caches.set(columnId, (cache = new Map()));
    if (cache.has(value)) return cache.get(value);
    let key = null;
    if (value !== "" && value != null) {
      const { type, decimal, dateOrder } = typeOf(columnId) || {};
      if (type === "numeric") {
        const n = toNumber(value, decimal);
        key = isNaN(n) ? null : n;
      } else if (type === "date") {
        const d = parseDate(value, dateOrder);
        key = d ? d.getTime() : null;
      } else {
        key = String(value);
      }
    }
    cache.set(value, key);
    return key;
  };

  return (a, b, columnId) => {
    const x = keyOf(a.getValue(columnId), columnId);
    const y = keyOf(b.getValue(columnId), columnId);
    if (x === null || y === null) {
      if (x === y) return 0;
      const last = x === null ? 1 : -1;
      return isDesc(columnId) ? -last : last;
    }
    return typeof x === "string" ? collator.compare(x, String(y)) : x - y;
  };
};
