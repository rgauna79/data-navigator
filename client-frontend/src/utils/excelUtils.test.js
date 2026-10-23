import { describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import {
  analyzeColumns,
  getHeaders,
  isDateColumn,
  isNumericColumn,
  minMax,
  parseDate,
  parseSheet,
  toNumber,
} from "./excelUtils.js";

describe("toNumber", () => {
  test.each([
    ["1,234.50", 1234.5],
    ["$2,000", 2000],
    ["€ 1,000", 1000],
    ["-$1,200.25", -1200.25],
    ["(1,200)", -1200],
    ["15%", 15],
    ["1e3", 1000],
    [".5", 0.5],
    [42, 42],
  ])("%j -> %d", (input, expected) => {
    expect(toNumber(input)).toBe(expected);
  });

  test.each(["", "abc", "12abc", "1/15/2024", "A1", null, undefined])(
    "%j no es un número",
    (input) => {
      expect(toNumber(input)).toBeNaN();
    }
  );
});

describe("parseDate", () => {
  test("acepta formatos de fecha habituales", () => {
    expect(parseDate("1/15/24")?.getMonth()).toBe(0);
    expect(parseDate("2024-03-05")).not.toBeNull();
    expect(parseDate("Jan 15, 2024")).not.toBeNull();
    expect(parseDate("1/15/24 10:30")).not.toBeNull();
  });

  test("los números nunca son fechas (new Date('1') sería 2001)", () => {
    for (const v of ["1", "123", "2024", "12.5", "1,234"]) {
      expect(parseDate(v)).toBeNull();
    }
  });

  test("texto cualquiera no es fecha", () => {
    expect(parseDate("hello")).toBeNull();
    expect(parseDate("")).toBeNull();
  });
});

describe("detección de tipo de columna", () => {
  test("columna de números formateados es numérica y no fecha", () => {
    const values = ["1", "2", "1,234.50", "$2,000", ""];
    expect(isNumericColumn(values)).toBe(true);
    expect(isDateColumn(values)).toBe(false);
  });

  test("columna de fechas", () => {
    expect(isDateColumn(["1/1/24", "2/15/24", "3/3/24"])).toBe(true);
  });
});

describe("minMax", () => {
  test("funciona con arrays enormes sin desbordar la pila", () => {
    const big = Array.from({ length: 300_000 }, (_, i) => i);
    expect(minMax(big)).toEqual({ min: 0, max: 299_999 });
  });
});

describe("parseSheet + analyzeColumns", () => {
  const buildWorkbook = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["ID", "Name", "Amount", "", "Date"],
      [1, "alice@Example.com", 1234.5, "x", new Date(Date.UTC(2024, 0, 15))],
      [2, "Bob", 2000, "", new Date(Date.UTC(2024, 1, 20))],
    ]);
    ws.C2.z = "#,##0.00";
    ws.C3.z = "$#,##0";
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "S");
    // Ida y vuelta por el formato xlsx, como un archivo real
    return XLSX.read(XLSX.write(wb, { type: "array", bookType: "xlsx" }), { type: "array" });
  };

  test("conserva mayúsculas/minúsculas y rellena celdas vacías", () => {
    const rows = parseSheet(buildWorkbook(), "S");
    expect(rows[1][1]).toBe("alice@Example.com");
    expect(rows.every((r) => r.length === 5)).toBe(true);
  });

  test("encabezados vacíos reciben un nombre", () => {
    expect(getHeaders(parseSheet(buildWorkbook(), "S"))[3]).toBe("Column 4");
  });

  test("suma correctamente números con formato de Excel", () => {
    const analysis = analyzeColumns(parseSheet(buildWorkbook(), "S"));
    const amount = analysis.find((c) => c.name === "Amount");
    expect(amount.type).toBe("numeric");
    expect(amount.sum).toBe(3234.5);

    expect(analysis.find((c) => c.name === "ID").type).toBe("numeric");
    expect(analysis.find((c) => c.name === "Date").type).toBe("date");
    expect(analysis.find((c) => c.name === "Name").type).toBe("categorical");
  });
});
