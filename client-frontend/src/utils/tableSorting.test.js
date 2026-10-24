import { describe, expect, test } from "vitest";
import { createSorter } from "./tableSorting.js";

const rowOf = (value) => ({ getValue: () => value });

// Ordena como TanStack: invierte el resultado si es descendente
const sortValues = (values, type, desc = false) => {
  const sorter = createSorter({ typeOf: () => type, isDesc: () => desc });
  return values
    .map(rowOf)
    .sort((a, b) => (desc ? -1 : 1) * sorter(a, b, "c"))
    .map((r) => r.getValue());
};

describe("createSorter", () => {
  test("números en formato español, vacíos al final en ambos sentidos", () => {
    const values = ["950", "", "1.200", "-", "12.500,5"];
    const type = { type: "numeric", decimal: "," };
    expect(sortValues(values, type)).toEqual(["950", "1.200", "12.500,5", "", "-"]);
    expect(sortValues(values, type, true).slice(0, 3)).toEqual(["12.500,5", "1.200", "950"]);
    expect(sortValues(values, type, true).slice(3).sort()).toEqual(["", "-"]);
  });

  test("fechas día/mes por fecha, no por texto", () => {
    const values = ["03/02/2024", "15/01/2024", "", "01/12/2023"];
    expect(sortValues(values, { type: "date", dateOrder: "dmy" })).toEqual([
      "01/12/2023", "15/01/2024", "03/02/2024", "",
    ]);
    expect(sortValues(values, { type: "date", dateOrder: "dmy" }, true)).toEqual([
      "03/02/2024", "15/01/2024", "01/12/2023", "",
    ]);
  });

  test("texto sin mayúsculas ni acentos y con números naturales", () => {
    expect(sortValues(["item 10", "Ítem 2", "", "apple"], { type: "text" })).toEqual([
      "apple", "Ítem 2", "item 10", "",
    ]);
  });
});
