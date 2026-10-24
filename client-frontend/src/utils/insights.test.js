import { describe, expect, test } from "vitest";
import { analyzeColumns } from "./excelUtils.js";
import { generateInsights } from "./insights.js";
import { duplicateRows, fillBlankChanges, replaceChanges, textVariants, unifyTextChanges } from "./cleanup.js";
import { numericProfile, percentile } from "./columnProfile.js";
import { keyRange, periodsInData, presetRange } from "./dateRanges.js";

const sheet = [
  ["Fecha", "Región", "Importe"],
  ["15/01/2024", "Norte", "100"],
  ["20/01/2024", "Norte", "100"],
  ["05/02/2024", "NORTE ", "300"],
  ["06/02/2024", "Sur", "50"],
  ["07/03/2024", "Sur", "10"],
  ["07/03/2024", "Sur", "10"],
  ["08/03/2024", "Este", ""],
  ["09/03/2024", "norte", "5000"],
  ["10/03/2024", "Sur", "20"],
  ["11/03/2024", "Sur", "25"],
];

describe("generateInsights", () => {
  const insights = generateInsights(sheet, analyzeColumns(sheet), 10);
  const byKind = Object.fromEntries(insights.map((i) => [i.kind, i]));

  test("tendencia del último mes y mejor mes", () => {
    expect(byKind.trend).toMatchObject({ measure: "Importe", last: "2024-03", previous: "2024-02" });
    expect(byKind.trend.change).toBeCloseTo(((5065 - 350) / 350) * 100);
    expect(byKind.peak).toMatchObject({ period: "2024-03", value: 5065 });
  });

  test("problemas de calidad", () => {
    expect(byKind.duplicates).toEqual({ kind: "duplicates", count: 1 });
    expect(byKind.variants).toMatchObject({ column: "Región", col: 1 });
    expect(byKind.outliers).toMatchObject({ column: "Importe", count: 1 }); // 5000
    expect(byKind.blanks).toMatchObject({ column: "Importe", count: 1 });
  });

  test("como máximo 6 y nada con una sola fila", () => {
    expect(generateInsights(sheet, analyzeColumns(sheet)).length).toBe(6);
    expect(generateInsights([["A"], ["1"]], analyzeColumns([["A"], ["1"]]))).toEqual([]);
  });
});

describe("limpieza", () => {
  test("duplicados: se conserva la primera fila", () => {
    expect(duplicateRows(sheet)).toEqual([6]);
  });

  test("variantes de texto y unificación con la más frecuente", () => {
    const [group] = textVariants(sheet, 1);
    expect(group.target).toBe("Norte");
    expect(unifyTextChanges(sheet, 1)).toEqual([
      { row: 3, col: 1, value: "Norte" },
      { row: 8, col: 1, value: "Norte" },
    ]);
  });

  test("buscar y reemplazar, celda completa o dentro del texto", () => {
    expect(replaceChanges(sheet, 1, "sur", "South", { whole: true })).toHaveLength(5);
    expect(replaceChanges(sheet, 1, "or", "OR")[0]).toEqual({ row: 1, col: 1, value: "NORte" });
    expect(replaceChanges(sheet, 1, "", "x")).toEqual([]);
  });

  test("rellenar celdas vacías", () => {
    expect(fillBlankChanges(sheet, 2, "0")).toEqual([{ row: 7, col: 2, value: "0" }]);
  });
});

describe("perfil numérico", () => {
  test("percentiles como Excel y límites de valores atípicos", () => {
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    const p = numericProfile([1, 2, 3, 4, 5, 6, 7, 8, 100]);
    expect(p.p50).toBe(5);
    expect(p.high).toBeLessThan(100);
  });
});

describe("rangos de fechas", () => {
  const today = new Date(2024, 4, 15); // 15 de mayo de 2024
  test("rangos rápidos", () => {
    expect(presetRange("thisMonth", today)).toEqual({ from: "2024-05-01", to: "2024-05-31" });
    expect(presetRange("lastMonth", today)).toEqual({ from: "2024-04-01", to: "2024-04-30" });
    expect(presetRange("thisQuarter", today)).toEqual({ from: "2024-04-01", to: "2024-06-30" });
    expect(presetRange("lastQuarter", today)).toEqual({ from: "2024-01-01", to: "2024-03-31" });
    expect(presetRange("lastYear", today)).toEqual({ from: "2023-01-01", to: "2023-12-31" });
    expect(presetRange("last30", today)).toEqual({ from: "2024-04-16", to: "2024-05-15" });
  });

  test("meses y años de los datos", () => {
    expect(keyRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    expect(keyRange("2023")).toEqual({ from: "2023-01-01", to: "2023-12-31" });
    const dates = [new Date(2024, 0, 5), new Date(2023, 11, 1), null, new Date(2024, 0, 9)];
    expect(periodsInData(dates)).toEqual({ months: ["2024-01", "2023-12"], years: ["2024", "2023"] });
  });
});
