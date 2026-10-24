import { describe, expect, test } from "vitest";
import { pivotRows } from "./pivot.js";
import { rowsInGroup } from "./reportUtils.js";

const rows = [
  ["Norte", "15/01/2024", "100"],
  ["Norte", "20/01/2024", "50"],
  ["Sur", "03/02/2024", "70"],
  ["Norte", "10/02/2024", "30"],
  ["Sur", "fecha mala", "999"],
];
const region = { groupIdx: 0, groupType: "category" };
const month = { groupIdx: 1, groupType: "date", dateOrder: "dmy", period: "month" };

describe("pivotRows", () => {
  test("suma por región y mes con totales", () => {
    const p = pivotRows({ rows, rowSpec: region, colSpec: month, metric: "sum", valueIdx: 2 });
    expect(p.rowKeys.map((r) => r.key)).toEqual(["Norte", "Sur"]);
    expect(p.colKeys.map((c) => c.key)).toEqual(["2024-01", "2024-02"]);
    expect(p.value("Norte", "2024-01")).toBe(150);
    expect(p.value("Sur", "2024-01")).toBeNull();
    expect(p.rowTotal("Norte")).toBe(180);
    expect(p.colTotal("2024-02")).toBe(100);
    expect(p.grandTotal).toBe(250);
    expect(p.skipped).toBe(1);
  });

  test("cantidad de filas y columnas sobrantes en Other", () => {
    const many = Array.from({ length: 30 }, (_, i) => [`R${i % 3}`, `C${i}`]);
    const p = pivotRows({ rows: many, rowSpec: region, colSpec: { groupIdx: 1, groupType: "category" }, maxCols: 5 });
    expect(p.colKeys).toHaveLength(5);
    expect(p.colKeys.at(-1)).toMatchObject({ isOther: true });
    expect(p.colKeys.at(-1).otherKeys).toHaveLength(26);
    expect(p.colTotal("Other")).toBe(26);
    expect(p.grandTotal).toBe(30);
  });
});

describe("rowsInGroup", () => {
  test("filas de una categoría, de un período o de varios grupos", () => {
    expect(rowsInGroup(rows, region, "Sur")).toHaveLength(2);
    expect(rowsInGroup(rows, month, "2024-01")).toHaveLength(2);
    expect(rowsInGroup(rows, region, ["Norte", "Sur"])).toHaveLength(5);
  });
});
