import { describe, expect, test } from "vitest";
import * as XLSX from "xlsx";
import { isSupportedFile, parseSheet, readWorkbook } from "./sheetParser.js";
import { analyzeColumns } from "./excelUtils.js";

const bytes = (text) => new TextEncoder().encode(text).buffer;
const firstSheet = (wb) => parseSheet(wb, wb.SheetNames[0]);

describe("isSupportedFile", () => {
  test.each(["a.xlsx", "a.XLS", "a.ods", "a.csv", "a.tsv", "a.xlsm"])("%s es válido", (name) => {
    expect(isSupportedFile(name)).toBe(true);
  });
  test.each(["a.pdf", "a.docx", "xlsx", ""])("%s no es válido", (name) => {
    expect(isSupportedFile(name)).toBe(false);
  });
});

describe("readWorkbook con CSV", () => {
  test("UTF-8 con acentos y BOM", () => {
    const wb = readWorkbook(bytes("﻿Nombre,Ciudad\nJosé,Córdoba\n"), "clientes.csv");
    expect(firstSheet(wb)).toEqual([["Nombre", "Ciudad"], ["José", "Córdoba"]]);
  });

  test("Windows-1252 (CSV de Excel en Windows)", () => {
    // "José" en Windows-1252: é = 0xE9
    const latin1 = new Uint8Array([...("Nombre\nJos")].map((c) => c.charCodeAt(0)).concat([0xe9, 10]));
    expect(firstSheet(readWorkbook(latin1.buffer, "a.csv"))[1][0]).toBe("José");
  });

  test("separador ; con números y fechas en formato español", () => {
    const csv = "Nombre;Monto;Fecha\nAna;1.234,50;15/01/2024\nLuis;2000,25;03/02/2024\n";
    const rows = firstSheet(readWorkbook(bytes(csv), "ventas.csv"));
    expect(rows[1]).toEqual(["Ana", "1.234,50", "15/01/2024"]);

    const [, monto, fecha] = analyzeColumns(rows);
    expect(monto.type).toBe("numeric");
    expect(monto.sum).toBe(3234.75);
    expect(fecha.type).toBe("date");
    expect(fecha.dateOrder).toBe("dmy");
    // 03/02/2024 en una columna dmy es 3 de febrero
    expect(fecha.max.getMonth()).toBe(1);
    expect(fecha.max.getDate()).toBe(3);
  });

  test("conserva ceros a la izquierda", () => {
    const rows = firstSheet(readWorkbook(bytes("Code\n00123\n"), "a.csv"));
    expect(rows[1][0]).toBe("00123");
  });

  test("la hoja toma el nombre del archivo", () => {
    expect(readWorkbook(bytes("a\n1\n"), "ventas 2024.csv").SheetNames).toEqual(["ventas 2024"]);
  });

  test("TSV", () => {
    expect(firstSheet(readWorkbook(bytes("a\tb\n1\t2\n"), "a.tsv"))).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("readWorkbook con formatos binarios", () => {
  const roundTrip = (bookType) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name", "Amount"], ["Ana", 10]]), "Data");
    return XLSX.write(wb, { type: "array", bookType });
  };

  test.each([["xls", "biff8"], ["ods", "ods"], ["xlsx", "xlsx"]])(".%s", (ext, bookType) => {
    const wb = readWorkbook(roundTrip(bookType), `file.${ext}`);
    expect(wb.SheetNames).toEqual(["Data"]);
    expect(parseSheet(wb, "Data")).toEqual([["Name", "Amount"], ["Ana", "10"]]);
  });
});
