import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";

// Libro con dos hojas: la lectura y el cambio de hoja pasan por el Web Worker
const multiSheet = () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Name", "Qty"], ["Pens", 3]]), "Stock");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["City", "Pop"], ["Lima", 10]]), "Cities");
  return Buffer.from(XLSX.write(wb, { type: "array", bookType: "xlsx" }));
};

test("cambia de hoja y la recupera tras recargar", async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/filereader");
  await page.locator("input[type=file]").setInputFiles({
    name: "multi.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: multiSheet(),
  });
  await expect(page.getByRole("cell", { name: "Pens" })).toBeVisible();
  await expect(page.locator("#sheetDropdown option")).toHaveText(["Stock", "Cities"]);

  await page.selectOption("#sheetDropdown", "Cities");
  await expect(page.getByRole("cell", { name: "Lima" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("cell", { name: "Lima" })).toBeVisible();
  await expect(page.locator("#sheetDropdown")).toHaveValue("Cities");
  await page.selectOption("#sheetDropdown", "Stock");
  await expect(page.getByRole("cell", { name: "Pens" })).toBeVisible();
});
