import { test, expect } from "@playwright/test";

// CSV que engaña a la detección automática: códigos postales que parecen
// números y fechas ambiguas (día <= 12) que se interpretan como mes/día
const csv = "Cliente;CP;Fecha;Monto\nAna;01234;03/02/2024;10,5\nLuis;02345;05/01/2024;20\nEva;03456;10/03/2024;30\n";

test("el usuario corrige el tipo y el orden de fechas de una columna", async ({ page }) => {
  await page.route("**/api/**", (route) => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  page.on("pageerror", (error) => {
    throw error;
  });
  await page.goto("/filereader");
  await page.locator("input[type=file]").setInputFiles({ name: "clientes.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(page.getByRole("cell", { name: "Ana" })).toBeVisible();

  // Detectado: CP numérico y fechas mes/día
  await expect(page.getByText("2 numeric · 1 date · 1 categorical")).toBeVisible();
  await page.getByLabel("CP type").selectOption("text");
  await page.getByLabel("Fecha date order").selectOption("dmy");
  await expect(page.getByText("1 numeric · 1 date · 2 categorical")).toBeVisible();

  // La tabla usa los tipos corregidos: filtro de texto en CP y fechas día/mes
  await page.getByRole("button", { name: "Filters" }).click();
  await expect(page.getByLabel("Filter CP")).toBeVisible();
  await page.getByLabel("Fecha to").fill("2024-01-31");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.getByRole("cell", { name: "Luis" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();

  // El informe también: CP ya no es numérico y las fechas se agrupan como día/mes
  await page.getByRole("button", { name: "Generate Report" }).click();
  await page.getByText("Group & summarize", { exact: true }).click();
  await page.selectOption("#metricSelect", { label: "Sum" });
  await expect(page.locator("#valueSelect option")).toHaveText(["Select a column", "Monto"]);
  await page.selectOption("#groupBySelect", { label: "Fecha (date)" });
  await page.selectOption("#valueSelect", { label: "Monto" });
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Jan 2024" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Mar 2024" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Oct 2024" })).toHaveCount(0);
});
