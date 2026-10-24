import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { setupApp } from "./helpers.js";

let app, teardown, staticDir;

before(async () => {
  // Modo producción con un frontend compilado falso
  staticDir = fs.mkdtempSync(path.join(os.tmpdir(), "dn-dist-"));
  fs.writeFileSync(path.join(staticDir, "index.html"), "<!doctype html><title>Data Navigator</title>");
  process.env.NODE_ENV = "production";
  process.env.STATIC_DIR = staticDir;
  ({ app, teardown } = await setupApp());
});
after(async () => {
  await teardown();
  fs.rmSync(staticDir, { recursive: true, force: true });
});

test("en producción las rutas del frontend devuelven index.html", async () => {
  for (const route of ["/", "/charts", "/savedfiles/123"]) {
    const res = await request(app).get(route);
    assert.equal(res.status, 200, route);
    assert.match(res.text, /Data Navigator/, route);
  }
});

test("en producción las rutas /api desconocidas dan 404, no la página", async () => {
  const res = await request(app).get("/api/does-not-exist");
  assert.equal(res.status, 404);
});

test("la API sigue respondiendo en producción", async () => {
  const res = await request(app).get("/api/auth/verify");
  assert.equal(res.status, 401);
});
