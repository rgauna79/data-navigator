import { describe, expect, test } from "vitest";
import { dateRangeFilter, numberRangeFilter, textFilter } from "./tableFilters.js";

// Fila mínima con la forma que usa TanStack Table
const rowOf = (value, meta) => ({
  getValue: () => value,
  getAllCells: () => [{ column: { id: "c", columnDef: { meta } } }],
});

describe("textFilter", () => {
  test("contiene, sin mayúsculas ni acentos", () => {
    expect(textFilter(rowOf("José Pérez"), "c", "jose")).toBe(true);
    expect(textFilter(rowOf("José Pérez"), "c", "PEREZ ")).toBe(true);
    expect(textFilter(rowOf("Ana"), "c", "jose")).toBe(false);
  });
  test("autoRemove con texto vacío", () => {
    expect(textFilter.autoRemove("  ")).toBe(true);
    expect(textFilter.autoRemove("a")).toBe(false);
  });
});

describe("numberRangeFilter", () => {
  test("mínimo, máximo o ambos, con números formateados", () => {
    expect(numberRangeFilter(rowOf("$1,234.50"), "c", ["1000", ""])).toBe(true);
    expect(numberRangeFilter(rowOf("1.234,50"), "c", ["", "1000"])).toBe(false);
    expect(numberRangeFilter(rowOf("500"), "c", ["100", "500"])).toBe(true);
    expect(numberRangeFilter(rowOf("n/a"), "c", ["0", ""])).toBe(false);
  });
  test("usa el separador decimal de la columna (meta.decimal)", () => {
    // En una columna en español "1.200" es mil doscientos, también en el filtro
    expect(numberRangeFilter(rowOf("1.200", { decimal: "," }), "c", ["1.000", ""])).toBe(true);
    expect(numberRangeFilter(rowOf("1.200", { decimal: "." }), "c", ["1000", ""])).toBe(false);
  });
  test("autoRemove sin límites", () => {
    expect(numberRangeFilter.autoRemove(["", ""])).toBe(true);
    expect(numberRangeFilter.autoRemove(["", "5"])).toBe(false);
  });
});

describe("dateRangeFilter", () => {
  test("rango inclusivo con el orden de fechas de la columna", () => {
    const row = rowOf("03/02/2024", { dateOrder: "dmy" }); // 3 de febrero
    expect(dateRangeFilter(row, "c", { from: "2024-02-01", to: "2024-02-03" })).toBe(true);
    expect(dateRangeFilter(row, "c", { from: "2024-02-04" })).toBe(false);
    expect(dateRangeFilter(rowOf("03/02/2024"), "c", { from: "2024-02-04" })).toBe(true); // mdy: 2 de marzo
  });
  test("autoRemove sin fechas", () => {
    expect(dateRangeFilter.autoRemove({ from: "", to: "" })).toBe(true);
  });
});
