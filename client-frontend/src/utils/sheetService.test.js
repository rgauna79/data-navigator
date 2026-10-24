import { describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import { createSheetService } from "./sheetService.js";

const workbookBuffer = () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Empty"]]), "Cover");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name"], ["Ana"]]), "Data");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Code"], ["X1"]]), "Other");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" });
};

describe("createSheetService", () => {
  test("open devuelve las hojas y la primera con datos, ya procesada", () => {
    const service = createSheetService();
    const result = service.open({ buffer: workbookBuffer(), name: "book.xlsx" });
    expect(result.sheetNames).toEqual(["Cover", "Data", "Other"]);
    expect(result.sheetName).toBe("Data");
    expect(result.rows).toEqual([["Name"], ["Ana"]]);
  });

  test("open respeta la hoja preferida (restaurar tras recargar)", () => {
    const service = createSheetService();
    const result = service.open({ buffer: workbookBuffer(), name: "book.xlsx", preferredSheet: "Other" });
    expect(result.sheetName).toBe("Other");
  });

  test("sheet carga otra hoja del archivo abierto", () => {
    const service = createSheetService();
    service.open({ buffer: workbookBuffer(), name: "book.xlsx" });
    expect(service.sheet({ sheetName: "Other" }).rows).toEqual([["Code"], ["X1"]]);
    expect(() => service.sheet({ sheetName: "Nope" })).toThrow("does not exist");
  });

  test("close descarta el archivo", () => {
    const service = createSheetService();
    service.open({ buffer: workbookBuffer(), name: "book.xlsx" });
    service.close();
    expect(() => service.sheet({ sheetName: "Data" })).toThrow();
  });

  test("CSV: la hoja toma el nombre del archivo", () => {
    const service = createSheetService();
    const result = service.open({ buffer: new TextEncoder().encode("a,b\n1,2\n").buffer, name: "ventas.csv" });
    expect(result).toMatchObject({ sheetNames: ["ventas"], sheetName: "ventas" });
  });
});
