import { describe, expect, test } from "vitest";
import { sampleFile, sampleRows } from "./sampleData.js";
import { analyzeColumns } from "./excelUtils.js";

describe("datos de ejemplo", () => {
  test("siempre son iguales y tienen tipos útiles para los informes", () => {
    expect(sampleRows("en")).toEqual(sampleRows("en"));
    const types = analyzeColumns(sampleRows("en")).map((c) => c.type);
    expect(types).toEqual(["date", "categorical", "categorical", "numeric", "numeric"]);
  });

  test("en español usan fechas día/mes e importes con coma decimal", () => {
    const analysis = analyzeColumns(sampleRows("es"));
    expect(analysis[0]).toMatchObject({ name: "Fecha", type: "date", dateOrder: "dmy" });
    expect(analysis[4]).toMatchObject({ name: "Importe", type: "numeric", decimal: "," });
    // Los importes en español suman lo mismo que en inglés
    const sumEn = analyzeColumns(sampleRows("en"))[4].sum;
    expect(analysis[4].sum).toBeCloseTo(sumEn, 2);
  });

  test("sampleFile devuelve un CSV con el nombre del idioma", async () => {
    const file = sampleFile("es");
    expect(file.name).toBe("ventas-ejemplo.csv");
    expect((await file.text()).split("\n")[0]).toBe("Fecha;Región;Producto;Unidades;Importe");
  });
});
