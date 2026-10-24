import { describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import {
  analyzeColumns,
  getHeaders,
  inferDateOrder,
  isDateColumn,
  isNumericColumn,
  minMax,
  parseDate,
  resolveColumnTypes,
  toNumber,
} from "./excelUtils.js";
import { parseSheet } from "./sheetParser.js";

describe("toNumber", () => {
  test.each([
    ["1,234.50", 1234.5],
    ["$2,000", 2000],
    ["€ 1,000", 1000],
    ["-$1,200.25", -1200.25],
    ["(1,200)", -1200],
    ["15%", 15],
    ["1e3", 1000],
    // Formato español
    ["1.234,50", 1234.5],
    ["2000,25", 2000.25],
    ["-3,5", -3.5],
    ["1.234.567", 1234567],
    ["€1.234,50", 1234.5],
    ["1\u00a0234,5", 1234.5],
    [".5", 0.5],
    [42, 42],
  ])("%j -> %d", (input, expected) => {
    expect(toNumber(input)).toBe(expected);
  });

  test.each(["", "abc", "12abc", "1/15/2024", "15.01.2024", "2024-02-03", "A1", null, undefined])(
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

  test("las fechas numéricas son locales: 2024-02-03 es 3 de febrero en cualquier zona horaria", () => {
    const d = parseDate("2024-02-03");
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2024, 1, 3]);
  });

  test("día/mes según el orden de la columna", () => {
    const mdy = parseDate("03/02/2024");
    const dmy = parseDate("03/02/2024", "dmy");
    expect([mdy.getMonth(), mdy.getDate()]).toEqual([2, 2]);
    expect([dmy.getMonth(), dmy.getDate()]).toEqual([1, 3]);
    // Un día > 12 no deja dudas aunque la columna se suponga mdy
    expect(parseDate("15/01/2024").getMonth()).toBe(0);
    expect(parseDate("15.01.2024", "dmy").getDate()).toBe(15);
  });

  test("con hora y años de 2 dígitos", () => {
    const d = parseDate("1/15/24 2:30 PM");
    expect([d.getFullYear(), d.getHours(), d.getMinutes()]).toEqual([2024, 14, 30]);
    expect(parseDate("1/1/45").getFullYear()).toBe(1945);
  });

  test("rechaza fechas imposibles", () => {
    expect(parseDate("2024-02-30")).toBeNull();
    expect(parseDate("13/13/2024")).toBeNull();
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

  test("inferDateOrder detecta columnas día/mes/año", () => {
    expect(inferDateOrder(["15/01/2024", "03/02/2024"])).toBe("dmy");
    expect(inferDateOrder(["01/15/2024", "03/02/2024"])).toBe("mdy");
    expect(inferDateOrder(["03/02/2024"])).toBe("mdy");
  });

  test("columna de números en formato español es numérica", () => {
    expect(isNumericColumn(["1.234,50", "2000,25", "3"])).toBe(true);
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

describe("resolveColumnTypes con correcciones manuales", () => {
  // Fechas ambiguas (día <= 12): la detección supone mes/día
  const sheet = [
    ["Zip", "Fecha", "Monto"],
    ["01234", "03/02/2024", "10"],
    ["02345", "05/01/2024", "20"],
  ];

  test("sin correcciones usa lo detectado", () => {
    expect(resolveColumnTypes(sheet)).toEqual([
      { type: "numeric", detected: "numeric", overridden: false },
      { type: "date", dateOrder: "mdy", detected: "date", overridden: false },
      { type: "numeric", detected: "numeric", overridden: false },
    ]);
  });

  test("el usuario puede forzar el tipo y el orden de las fechas", () => {
    const types = resolveColumnTypes(sheet, { 0: { type: "text" }, 1: { dateOrder: "dmy" } });
    expect(types[0]).toMatchObject({ type: "text", detected: "numeric", overridden: true });
    expect(types[1]).toMatchObject({ type: "date", dateOrder: "dmy", overridden: true });
  });

  test("analyzeColumns respeta las correcciones", () => {
    const analysis = analyzeColumns(sheet, resolveColumnTypes(sheet, { 0: { type: "text" }, 1: { dateOrder: "dmy" } }));
    expect(analysis[0].type).toBe("categorical");
    expect(analysis[0].topValues.map(([v]) => v)).toEqual(["01234", "02345"]);
    // 03/02/2024 en día/mes es 3 de febrero; 05/01/2024 es 5 de enero
    expect(analysis[1].min.getMonth()).toBe(0);
    expect(analysis[1].max.getMonth()).toBe(1);
    expect(analysis[1].max.getDate()).toBe(3);
  });

  test("forzar número en una columna de texto cuenta los valores no numéricos", () => {
    const analysis = analyzeColumns(
      [["Code"], ["10"], ["n/a"], ["20"]],
      resolveColumnTypes([["Code"], ["10"], ["n/a"], ["20"]], { 0: { type: "numeric" } })
    );
    expect(analysis[0]).toMatchObject({ type: "numeric", sum: 30, invalid: 1 });
  });
});
