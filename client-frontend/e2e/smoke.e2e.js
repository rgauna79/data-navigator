import { test, expect } from "@playwright/test";
import * as XLSX from "xlsx";

// Hoja de prueba: números con formato de moneda y fechas reales de Excel
const salesWorkbook = () => {
  const d = (m, day) => new Date(Date.UTC(2024, m, day));
  const ws = XLSX.utils.aoa_to_sheet(
    [
      ["ID", "Name", "Category", "Amount", "Date"],
      [1, "Alice", "A", 1234.5, d(0, 15)],
      [2, "Bob", "B", 2000, d(0, 20)],
      [3, "Carol", "A", 500, d(1, 3)],
      [4, "Dave", "A", 250.25, d(1, 28)],
      [5, "Erin", "C", 100, d(2, 10)],
      [6, "Frank", "B", 75, d(2, 11)],
    ],
    { cellDates: true }
  );
  for (let r = 2; r <= 7; r++) {
    ws[`D${r}`].z = "$#,##0.00";
    ws[`E${r}`].z = "m/d/yy";
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sales");
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
    name: "sales.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: salesWorkbook(),
  });
  await expect(page.getByRole("cell", { name: "Alice" })).toBeVisible();
});

test("lee el Excel, resume columnas y filtra la tabla", async ({ page }) => {
  await expect(page.getByText("2 numeric · 1 date · 2 categorical")).toBeVisible();
  await expect(page.getByText("4,159.75")).toBeVisible();

  await page.getByRole("button", { name: "Filters" }).click();
  await page.getByLabel("Amount minimum").fill("500");
  await page.getByLabel("Filter Category").fill("a");
  await page.getByLabel("Date from").fill("2024-02-01");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByRole("cell", { name: "Carol" })).toBeVisible();
});

test("informe de estadísticas con filtro de fechas", async ({ page }) => {
  await page.getByRole("button", { name: "Generate Report" }).click();
  await page.getByText("Statistics", { exact: true }).click();
  await page.locator("label", { hasText: "Category" }).locator("input").check();
  await page.locator("select").filter({ hasText: "Select a value" }).selectOption("A");
  // Marcar una columna de fecha monta los DatePicker
  await page.locator("label", { hasText: /^Date$/ }).locator("input").check();
  const dates = page.locator(".react-datepicker__input-container input");
  await expect(dates.nth(0)).toHaveValue("01/15/2024");
  await dates.nth(1).fill("02/03/2024");
  await dates.nth(1).press("Enter");
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(page).toHaveURL(/\/charts$/);
  await expect(page.getByText("Total matching rows")).toBeVisible();
  await expect(page.getByText("1,734.50")).toBeVisible();
});

test("informe agrupado con gráfico y tabla", async ({ page }) => {
  await page.getByRole("button", { name: "Generate Report" }).click();
  await page.getByText("Group & summarize", { exact: true }).click();
  await page.selectOption("#groupBySelect", { label: "Category" });
  await page.selectOption("#metricSelect", { label: "Sum" });
  await page.selectOption("#valueSelect", { label: "Amount" });
  await page.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Sum of Amount by Category" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("cell", { name: "2,075.00" })).toBeVisible();
});
