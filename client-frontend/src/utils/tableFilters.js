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

// Metadatos de la columna (tipo, orden de fechas, separador decimal).
// _getAllCellsByColumnId es el índice (memorizado) que usa TanStack Table.
const metaOf = (row, columnId) => {
  const cell = row._getAllCellsByColumnId
    ? row._getAllCellsByColumnId()[columnId]
    : row.getAllCells().find((c) => c.column.id === columnId);
  return cell?.column.columnDef.meta || {};
};

// Rango numérico [min, max]; cualquiera de los dos puede estar vacío.
// Los límites se leen con el mismo formato que la columna ("1.000" en español).
export const numberRangeFilter = (row, columnId, [min, max] = []) => {
  const { decimal } = metaOf(row, columnId);
  const n = toNumber(row.getValue(columnId), decimal);
  if (isNaN(n)) return false;
  const lo = toNumber(String(min ?? ""), decimal);
  const hi = toNumber(String(max ?? ""), decimal);
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
  const d = parseDate(row.getValue(columnId), metaOf(row, columnId).dateOrder);
  if (!d) return false;
  const start = fromInput(from);
  const end = fromInput(to, true);
  return (!start || d >= start) && (!end || d <= end);
};
dateRangeFilter.autoRemove = (value) => !value || (!value.from && !value.to);
