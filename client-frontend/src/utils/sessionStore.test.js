import "fake-indexeddb/auto";
import { describe, expect, test } from "vitest";
import { clearSession, loadSession, saveSession, updateSession } from "./sessionStore.js";

describe("sessionStore", () => {
  test("guarda y recupera Blobs y fechas sin perder el tipo", async () => {
    const file = new Blob(["hello"], { type: "text/plain" });
    const from = new Date(2024, 0, 15);
    await saveSession("excel", { file, name: "a.xlsx", selectedSheet: "S1", from });

    const saved = await loadSession("excel");
    expect(saved.name).toBe("a.xlsx");
    expect(saved.from).toBeInstanceOf(Date);
    expect(saved.from.getTime()).toBe(from.getTime());
    expect(await saved.file.text()).toBe("hello");
  });

  test("updateSession solo cambia los campos indicados", async () => {
    await saveSession("excel", { name: "a.xlsx", selectedSheet: "S1" });
    await updateSession("excel", { selectedSheet: "S2" });
    expect(await loadSession("excel")).toEqual({ name: "a.xlsx", selectedSheet: "S2" });
  });

  test("updateSession no crea registros que no existen", async () => {
    await updateSession("missing", { a: 1 });
    expect(await loadSession("missing")).toBeUndefined();
  });

  test("clearSession borra una clave o todo", async () => {
    await saveSession("excel", { a: 1 });
    await saveSession("report", { b: 2 });
    await clearSession("excel");
    expect(await loadSession("excel")).toBeUndefined();
    expect(await loadSession("report")).toEqual({ b: 2 });
    await clearSession();
    expect(await loadSession("report")).toBeUndefined();
  });
});
