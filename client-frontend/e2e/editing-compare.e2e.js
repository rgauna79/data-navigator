import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";

// Dos hojas con la misma estructura para editar y comparar
const workbook = () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([["Product", "Qty"], ["Pens", 3], ["Paper", 5], ["Ink", 2]]),
    "January"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([["Product", "Qty"], ["Pens", 6], ["Paper", 5], ["Ink", 2]]),
    "February"
  );
  return Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
};

test.beforeEach(async ({ page }) => {
  // El backend no corre en estas pruebas: la sesión responde 401
  await page.route("**/api/**", (route) => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/filereader");
  await page.locator("input[type=file]").setInputFiles({
    name: "stock.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: workbook(),
  });
  await expect(page.getByRole("cell", { name: "Pens" })).toBeVisible();
});

test("edita una celda, la conserva al recargar y la deshace", async ({ page }) => {
  await page.getByRole("cell", { name: "Paper" }).locator("div").dblclick();
  const input = page.getByLabel("Edit Product");
  await input.fill("Notebooks");
  await input.press("Enter");
  await expect(page.getByRole("cell", { name: "Notebooks" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Paper" })).toHaveCount(0);

  // Las ediciones sobreviven a una recarga
  await page.reload();
  await expect(page.getByRole("cell", { name: "Notebooks" })).toBeVisible();

  await page.getByRole("button", { name: "Undo edit" }).click();
  await expect(page.getByRole("cell", { name: "Paper" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo edit" })).toHaveCount(0);
});

test("oculta columnas de la tabla", async ({ page }) => {
  await page.getByRole("button", { name: "Columns" }).click();
  await page.locator("label", { hasText: /^Qty$/ }).locator("input").uncheck();
  await expect(page.getByRole("columnheader", { name: "Qty" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Product" })).toBeVisible();
});

test("compara dos hojas del archivo abierto", async ({ page }) => {
  await page.getByRole("link", { name: "Compare" }).first().click();
  await expect(page.getByRole("heading", { name: "Data Auditor" })).toBeVisible();
  await page.getByLabel("Primary Source (A) sheet").selectOption("January");
  await page.getByLabel("Comparison Target (B) sheet").selectOption("February");
  await expect(page.getByText("2 Columns")).toBeVisible();
  // Qty: la suma y la media suben un 30% (de 10 a 13)
  await expect(page.getByText("30.0%")).toHaveCount(2);
});

test("informe de valores más repetidos con cantidad elegida", async ({ page }) => {
  await page.getByRole("button", { name: "Generate Report" }).click();
  await page.getByText("Most repeated", { exact: true }).click();
  await page.selectOption("#mostRepeatedSelect", { label: "Product" });
  await page.getByLabel("Number of top values").fill("2");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByText("Top 2 most repeated values in Product")).toBeVisible();
});
