import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import es from "./es.js";
import { createTranslator } from "./I18nContext.jsx";

// Todos los archivos de código del frontend (sin pruebas)
const sourceFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.jsx?$/.test(name) && !name.includes(".test.") ? [path] : [];
  });

const STR = String.raw`("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')`;
const PATTERNS = [
  new RegExp(String.raw`\bt\(\s*` + STR, "g"),
  new RegExp(String.raw`\btk\(\s*` + STR, "g"),
  new RegExp(String.raw`\btn\(\s*` + STR + String.raw`\s*,\s*` + STR, "g"),
  new RegExp(String.raw`\btServer\([^,()]*(?:\([^()]*\))?[^,()]*,\s*` + STR, "g"),
  new RegExp(String.raw`\berrorMessage\(\s*err\s*,\s*` + STR, "g"),
];
const unquote = (s) => (s.startsWith('"') ? JSON.parse(s) : s.slice(1, -1).replace(/\\'/g, "'"));

const usedKeys = () => {
  const keys = new Set();
  for (const file of sourceFiles(join(__dirname, ".."))) {
    const code = readFileSync(file, "utf8");
    for (const re of PATTERNS) {
      for (const m of code.matchAll(re)) m.slice(1).filter(Boolean).forEach((g) => keys.add(unquote(g)));
    }
  }
  return [...keys];
};

describe("traducciones", () => {
  test("todos los textos de la interfaz tienen traducción al español", () => {
    const missing = usedKeys().filter((key) => !(key in es));
    expect(missing).toEqual([]);
  });

  test("los mensajes de la API tienen traducción al español", () => {
    const backend = join(__dirname, "../../../backend/src");
    const messages = sourceFiles(backend).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/message: "([^"]+)"/g)].map((m) => m[1])
    );
    expect(messages.length).toBeGreaterThan(10);
    expect(messages.filter((m) => !(m in es))).toEqual([]);
  });

  test("las traducciones conservan las partes variables", () => {
    for (const [key, value] of Object.entries(es)) {
      const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
      expect(vars(value), key).toBe(vars(key));
    }
  });
});

describe("createTranslator", () => {
  test("traduce, interpola y usa el texto en inglés si falta la traducción", () => {
    const { t } = createTranslator("es");
    expect(t("Save")).toBe("Guardar");
    expect(t("Top {n}", { n: 5 })).toBe("Los 5 mayores");
    expect(t("Not translated")).toBe("Not translated");
    expect(createTranslator("en").t("Top {n}", { n: 5 })).toBe("Top 5");
  });

  test("plurales y números en el formato del idioma", () => {
    const es = createTranslator("es");
    expect(es.tn("{count} row", "{count} rows", 1)).toBe("1 fila");
    expect(es.tn("{count} row", "{count} rows", 1234)).toBe("1.234 filas");
    expect(es.fmtDecimal(2592283.68)).toBe("2.592.283,68");
    expect(createTranslator("en").fmtDecimal(2592283.68)).toBe("2,592,283.68");
  });

  test("mensajes del servidor con partes variables", () => {
    const { tServer } = createTranslator("es");
    expect(tServer('A saved file named "Ventas" already exists.')).toBe('Ya existe un archivo guardado llamado "Ventas".');
    expect(tServer(undefined, "Could not open the file.")).toBe("No se pudo abrir el archivo.");
    expect(tServer("Unauthorized")).toBe("Tu sesión ha caducado. Vuelve a iniciar sesión.");
  });
});
