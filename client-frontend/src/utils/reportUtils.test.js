import { describe, expect, test } from "vitest";
import { aggregate, applyFilters, describeFilter, exportRows, groupRows, periodOf, toCsv } from "./reportUtils.js";

// Cliente, Categoría, Monto, Fecha
const rows = [
  ["José", "A", "1.234,50", "15/01/2024"],
  ["María", "B", "2.000,00", "20/01/2024"],
  ["Ángel", "A", "500,00", "03/02/2024"],
  ["Noemí", "A", "250,25", "28/02/2024"],
  ["Sofía", "C", "100,00", "10/04/2024"],
  ["Iñaki", "", "75,00", "fecha?"],
];

describe("aggregate", () => {
  test("métricas sobre valores numéricos, ignorando texto", () => {
    const values = ["10", "$20", "abc", ""];
    expect(aggregate(4, values, "count")).toBe(4);
    expect(aggregate(4, values, "sum")).toBe(30);
    expect(aggregate(4, values, "avg")).toBe(15);
    expect(aggregate(4, values, "min")).toBe(10);
    expect(aggregate(4, values, "max")).toBe(20);
    expect(aggregate(1, ["x"], "sum")).toBeNull();
  });
});

describe("periodOf", () => {
  const d = new Date(2024, 0, 3); // miércoles 3 de enero de 2024
  test.each([
    ["day", "2024-01-03", "Jan 3, 2024"],
    ["week", "2024-W01", "Week 1, 2024"],
    ["month", "2024-01", "Jan 2024"],
    ["quarter", "2024-Q1", "Q1 2024"],
    ["year", "2024", "2024"],
  ])("%s", (period, key, label) => {
    expect(periodOf(d, period)).toEqual({ key, label });
  });

  test("semana ISO que cruza el año", () => {
    expect(periodOf(new Date(2021, 0, 1), "week").key).toBe("2020-W53");
  });
});

describe("groupRows por categoría", () => {
  test("suma por categoría, de mayor a menor, con vacíos como (blank)", () => {
    const { groups, total } = groupRows({ rows, groupIdx: 1, metric: "sum", valueIdx: 2 });
    expect(groups.map((g) => [g.label, g.value, g.rows])).toEqual([
      ["B", 2000, 1],
      ["A", 1984.75, 3],
      ["C", 100, 1],
      ["(blank)", 75, 1],
    ]);
    expect(total).toBe(4159.75);
  });

  test("top N junta el resto en Other calculado sobre sus filas", () => {
    const { groups } = groupRows({ rows, groupIdx: 1, metric: "avg", valueIdx: 2, topN: 1 });
    expect(groups[0]).toMatchObject({ label: "B", value: 2000 });
    // Other = promedio de A (3 filas), C y (blank): (1984.75 + 100 + 75) / 5
    expect(groups[1]).toMatchObject({ label: "Other (3 groups)", rows: 5, isOther: true });
    expect(groups[1].value).toBeCloseTo(431.95);
  });

  test("count no necesita columna de valor", () => {
    const { groups } = groupRows({ rows, groupIdx: 1, metric: "count" });
    expect(groups[0]).toMatchObject({ label: "A", value: 3 });
  });
});

describe("groupRows por fecha", () => {
  test("agrupa por mes en orden cronológico y rellena meses vacíos", () => {
    const { groups, skipped } = groupRows({
      rows,
      groupIdx: 3,
      groupType: "date",
      dateOrder: "dmy",
      period: "month",
      metric: "sum",
      valueIdx: 2,
    });
    expect(groups.map((g) => [g.label, g.value])).toEqual([
      ["Jan 2024", 3234.5],
      ["Feb 2024", 750.25],
      ["Mar 2024", 0],
      ["Apr 2024", 100],
    ]);
    expect(skipped).toBe(1);
  });

  test("en promedios, los períodos vacíos no tienen valor", () => {
    const { groups } = groupRows({
      rows, groupIdx: 3, groupType: "date", dateOrder: "dmy", period: "month", metric: "avg", valueIdx: 2,
    });
    expect(groups.find((g) => g.label === "Mar 2024").value).toBeNull();
  });

  test("por trimestre", () => {
    const { groups } = groupRows({
      rows, groupIdx: 3, groupType: "date", dateOrder: "dmy", period: "quarter", metric: "count",
    });
    expect(groups.map((g) => [g.label, g.value])).toEqual([["Q1 2024", 4], ["Q2 2024", 1]]);
  });
});

describe("applyFilters", () => {
  test("valor exacto y rango de fechas (día final incluido)", () => {
    const analysis = [{}, {}, {}, { dateOrder: "dmy" }];
    const filtered = applyFilters(
      rows,
      { 1: "A", 3: { from: new Date(2024, 0, 1), to: new Date(2024, 1, 3) } },
      analysis
    );
    expect(filtered.map((r) => r[0])).toEqual(["José", "Ángel"]);
  });
});

describe("toCsv", () => {
  test("escapa comas, comillas y saltos de línea", () => {
    expect(toCsv([["a", "b,c"], ['say "hi"', "x\ny"], [1, null]])).toBe(
      'a,"b,c"\r\n"say ""hi""","x\ny"\r\n1,'
    );
  });
});

describe("exportRows", () => {
  test("encabezados + filas; columnas numéricas como número", () => {
    const headers = ["Name", "Amount", "Code"];
    const data = [["Ana", "$1,234.50", "007"], ["Luis", "n/a"]];
    expect(exportRows(headers, data, new Set([1]))).toEqual([
      ["Name", "Amount", "Code"],
      ["Ana", 1234.5, "007"],
      ["Luis", "n/a", ""],
    ]);
  });

  test("sin columnas numéricas conserva el texto", () => {
    expect(exportRows(["A"], [["1,5"]])).toEqual([["A"], ["1,5"]]);
  });
});

describe("filtros numéricos y formato español", () => {
  const rows = [["A", "1.200"], ["B", "950"], ["C", "12.500"], ["D", "-"]];
  const analysis = [{}, { decimal: "," }];

  test("rango mínimo/máximo con el separador de la columna", () => {
    expect(applyFilters(rows, { 1: { min: "1.000", max: "" } }, analysis).map((r) => r[0])).toEqual(["A", "C"]);
    expect(applyFilters(rows, { 1: { min: "", max: "1000" } }, analysis).map((r) => r[0])).toEqual(["B"]);
    expect(applyFilters(rows, { 1: { min: "900", max: "1.500" } }, analysis).map((r) => r[0])).toEqual(["A", "B"]);
  });

  test("groupRows suma miles en español", () => {
    const { groups, total } = groupRows({
      rows: [["X", "1.200"], ["X", "950"], ["Y", "12.500"]],
      groupIdx: 0,
      groupType: "category",
      metric: "sum",
      valueIdx: 1,
      decimal: ",",
    });
    expect(total).toBe(14650);
    expect(groups.map((g) => [g.label, g.value])).toEqual([["Y", 12500], ["X", 2150]]);
  });

  test("exportRows convierte con el separador de cada columna", () => {
    const out = exportRows(["N"], [["1.200"]], new Set([0]), () => ",");
    expect(out[1][0]).toBe(1200);
  });

  test("describeFilter", () => {
    expect(describeFilter({ min: "10", max: "20" })).toBe("10 – 20");
    expect(describeFilter({ min: "10", max: "" })).toBe("≥ 10");
    expect(describeFilter({ min: "", max: "20" })).toBe("≤ 20");
    expect(describeFilter("North")).toBe("North");
  });
});
