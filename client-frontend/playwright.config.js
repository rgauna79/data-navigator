import { defineConfig, devices } from "@playwright/test";

// Pruebas de humo en navegador contra la compilación de producción.
// Detectan fallos que los tests unitarios no ven (p. ej. un componente que
// se importa mal y rompe la página al usarlo).
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.js",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
