import { test, expect } from "@playwright/test";

// Ventas con problemas a propósito: una fila duplicada (la última), regiones
// escritas distinto ("north", "NORTH"), una región vacía y un importe atípico (500)
const CSV = [
  "Product,Region,Date,Amount",
  "Pens,North,2024-01-10,10",
  "Paper,South,2024-01-20,20",
  "Ink,North,2024-02-05,15",
  "Pens,north,2024-02-15,12",
  "Paper,NORTH,2024-03-01,18",
  "Ink,South,2024-03-10,14",
  "Pens,,2024-03-20,11",
  "Paper,South,2024-03-25,16",
  "Ink,South,2024-03-28,500",
  "Pens,North,2024-01-10,10",
].join("\n");

const rowCount = (page, n) => expect(page.getByText(new RegExp(`· ${n} rows?$`))).toBeVisible();
const dialog = (page) => page.getByRole("dialog");

test.beforeEach(async ({ page }) => {
  // El backend no corre en estas pruebas: la sesión responde 401
  await page.route("**/api/**", (route) => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/filereader");
  await page.locator("input[type=file]").setInputFiles({ name: "sales.csv", mimeType: "text/csv", buffer: Buffer.from(CSV) });
  await expect(page.getByRole("cell", { name: "Paper" }).first()).toBeVisible();
  await rowCount(page, 10);
});

test("conclusiones automáticas: duplicados, valores atípicos y celdas vacías", async ({ page }) => {
  await expect(page.getByText("Key findings")).toBeVisible();
  await expect(page.getByText("1 row is an exact copy of another one.")).toBeVisible();
  await expect(page.getByText("Amount has 1 unusual value, far from the rest.")).toBeVisible();

  // Ver las filas del valor atípico
  const outliers = page.getByRole("listitem").filter({ hasText: "unusual value" });
  await outliers.getByRole("button", { name: "See them" }).click();
  await expect(dialog(page).getByRole("heading", { name: "Unusual values of Amount" })).toBeVisible();
  await expect(dialog(page).getByRole("cell", { name: "500" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);

  // Quitar el duplicado y deshacerlo
  await page.getByRole("listitem").filter({ hasText: "exact copy" }).getByRole("button", { name: "Remove duplicates" }).click();
  await rowCount(page, 9);
  await expect(page.getByText("1 row is an exact copy of another one.")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo edit" }).click();
  await rowCount(page, 10);
});

test("limpieza de datos: unificar textos, reemplazar y rellenar vacíos", async ({ page }) => {
  await page.getByRole("button", { name: "Clean data" }).click();
  const cleanup = dialog(page);
  await expect(cleanup.getByRole("heading", { name: "Clean data" })).toBeVisible();

  await cleanup.getByLabel("Column to unify").selectOption({ label: "Region" });
  await cleanup.getByRole("button", { name: "Unify 2 cells" }).click();
  await expect(cleanup.getByText("Every value is written the same way.")).toBeVisible();

  await cleanup.getByLabel("Column to search").selectOption({ label: "Product" });
  await cleanup.getByLabel("Find").fill("Pens");
  await cleanup.getByLabel("Replace with").fill("Pencils");
  await cleanup.getByRole("button", { name: "Replace 4 cells" }).click();

  await cleanup.getByLabel("Column with empty cells").selectOption({ label: "Region" });
  await expect(cleanup.getByText("1 row has this cell empty.")).toBeVisible();
  await cleanup.getByLabel("Fill with", { exact: true }).fill("West");
  await cleanup.getByRole("button", { name: "Fill", exact: true }).click();
  await expect(cleanup.getByText("No empty cells in this column.")).toBeVisible();
  await cleanup.getByRole("button", { name: "Close" }).click();

  await expect(page.getByRole("cell", { name: "north", exact: true })).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "Pencils" })).toHaveCount(4);
  await expect(page.getByRole("cell", { name: "West" })).toBeVisible();

  // Cada acción se deshace por separado
  await page.getByRole("button", { name: "Undo edit" }).click();
  await expect(page.getByRole("cell", { name: "West" })).toHaveCount(0);
  await expect(page.getByRole("cell", { name: "Pencils" })).toHaveCount(4);
});

test("filtro rápido por mes y detalle de una columna", async ({ page }) => {
  await page.getByLabel("Quick period for Date").first().selectOption({ label: "Mar 2024" });
  await rowCount(page, 5);
  await expect(page.getByText("Date: Mar 1, 2024 → Mar 31, 2024")).toBeVisible();
  await page.getByRole("button", { name: "Remove period filter" }).click();
  await rowCount(page, 10);

  // Detalle de la columna Amount desde el resumen
  await page.getByRole("button", { name: /Dataset Intelligence/ }).click();
  await page.getByRole("button", { name: "Details of Amount" }).click();
  await expect(dialog(page).getByRole("heading", { name: "Amount" })).toBeVisible();
  await expect(dialog(page).getByText("Percentiles")).toBeVisible();
  await expect(dialog(page).getByText("1 value is above")).toBeVisible();
  await expect(dialog(page).getByRole("img", { name: "Total per month (Date)" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Todos los valores de una columna de texto, con sus filas
  await page.getByRole("button", { name: "Details of Product" }).click();
  await dialog(page).getByRole("button", { name: "Paper" }).click();
  await expect(page.getByRole("heading", { name: "Product: Paper" })).toBeVisible();
  await expect(page.getByText(/^3 rows$/).first()).toBeVisible();
});

test("tabla dinámica y ver las filas de un resultado", async ({ page }) => {
  await page.getByRole("button", { name: "Generate Report" }).click();
  const modal = dialog(page);
  await modal.getByText("Pivot table", { exact: true }).click();
  await modal.getByLabel("Rows", { exact: true }).selectOption({ label: "Product" });
  await modal.getByLabel("Columns", { exact: true }).selectOption({ label: "Date (date)" });
  await modal.getByLabel("Per", { exact: true }).selectOption({ label: "Month" });
  // Filtro rápido: solo marzo
  await modal.locator("label", { hasText: /^Date$/ }).locator("input").check();
  await modal.getByLabel("Quick period for Date").selectOption({ label: "Mar 2024" });
  await modal.getByRole("button", { name: "Generate", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Count of rows by Product and Date" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Mar 2024" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Jan 2024" })).toHaveCount(0);

  // Clic en el total de Ink: sus 2 filas de marzo
  await page.getByRole("row", { name: /^Ink/ }).getByRole("button").last().click();
  await expect(dialog(page).getByText("Pivot table · 2 rows")).toBeVisible();
  await expect(dialog(page).getByRole("cell", { name: "500" })).toBeVisible();
});
