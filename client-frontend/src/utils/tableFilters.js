// Filtros por columna de la tabla (TanStack Table). Cada filtro recibe la
// fila, el id de la columna y el valor del filtro, y se elimina solo cuando
// queda vacío (autoRemove).
import { parseDate, toNumber } from "./excelUtils.js";

const isBlank = (v) => v === undefined || v === null || v === "";

// Texto que contiene, sin distinguir mayúsculas ni acentos ("jose" encuentra "José")
const normalize = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const textFilter = (row, columnId, value) =>
  normalize(row.getValue(columnId)).includes(normalize(value).trim());
textFilter.autoRemove = (value) => isBlank(value) || !String(value).trim();

// Rango numérico [min, max]; cualquiera de los dos puede estar vacío
export const numberRangeFilter = (row, columnId, [min, max] = []) => {
  const n = toNumber(row.getValue(columnId));
  if (isNaN(n)) return false;
  const lo = toNumber(String(min ?? ""));
  const hi = toNumber(String(max ?? ""));
  return (isNaN(lo) || n >= lo) && (isNaN(hi) || n <= hi);
};
numberRangeFilter.autoRemove = (value) =>
  !value || (isNaN(toNumber(String(value[0] ?? ""))) && isNaN(toNumber(String(value[1] ?? ""))));

// Fecha "YYYY-MM-DD" de un <input type="date"> como fecha local
const fromInput = (s, endOfDay = false) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
};

// Rango de fechas { from, to } (ambos opcionales). La columna define el
// orden día/mes con columnDef.meta.dateOrder.
export const dateRangeFilter = (row, columnId, { from, to } = {}) => {
  const order = row.getAllCells().find((c) => c.column.id === columnId)?.column.columnDef.meta?.dateOrder;
  const d = parseDate(row.getValue(columnId), order);
  if (!d) return false;
  const start = fromInput(from);
  const end = fromInput(to, true);
  return (!start || d >= start) && (!end || d <= end);
};
dateRangeFilter.autoRemove = (value) => !value || (!value.from && !value.to);
