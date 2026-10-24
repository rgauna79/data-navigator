import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // El backend no corre en estas pruebas: la sesión responde 401
  await page.route("**/api/**", (route) => route.fulfill({ status: 401, json: { message: "Unauthorized" } }));
  page.on("pageerror", (error) => {
    throw error;
  });
});

test("en español: datos de ejemplo, lector compacto, estadísticas e informe por mes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Change language/ }).click();
  await expect(page.getByRole("heading", { name: "Bienvenido a Data Navigator" })).toBeVisible();

  // Datos de ejemplo desde el inicio: abre el lector con el archivo en español
  await page.getByRole("button", { name: "Probar con datos de ejemplo" }).click();
  await expect(page).toHaveURL(/\/filereader$/);
  await expect(page.getByText("ventas-ejemplo.csv")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cambiar archivo" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Norte" }).first()).toBeVisible();
  await expect(page.getByText("2 numéricas · 1 de fecha · 2 de texto")).toBeVisible();

  // Estadísticas sin filtros, con histogramas y números en formato español
  await page.getByRole("button", { name: "Generar informe" }).click();
  await page.getByText("Estadísticas", { exact: true }).click();
  await page.getByRole("button", { name: "Generar", exact: true }).click();
  await expect(page.getByText("Filas que cumplen los filtros")).toBeVisible();
  await expect(page.locator("main").getByText("300", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Distribución de Importe" })).toBeVisible();
  // Suma de importes con punto de miles y coma decimal
  await expect(page.locator("main").getByText(/^\d{1,3}(\.\d{3})*,\d{2}$/).first()).toBeVisible();

  // Agrupar por mes: etiquetas de mes en español
  await page.getByRole("button", { name: "Volver" }).click();
  await page.getByRole("button", { name: "Generar informe" }).click();
  await page.getByText("Agrupar y resumir", { exact: true }).click();
  await page.selectOption("#groupBySelect", { label: "Fecha (fecha)" });
  await page.selectOption("#metricSelect", { label: "Suma" });
  await page.selectOption("#valueSelect", { label: "Importe" });
  await page.getByRole("button", { name: "Generar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Suma de Importe por Fecha (por mes)" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "ene 2024" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "dic 2024" })).toBeVisible();

  // El idioma se recuerda al recargar
  await page.reload();
  await expect(page.getByRole("heading", { name: "Informe", exact: true })).toBeVisible();
});
