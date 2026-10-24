import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { setupApp } from "./helpers.js";

let app, teardown;

before(async () => {
  // Producción sin frontend compilado: el frontend se publica aparte (Render)
  process.env.NODE_ENV = "production";
  process.env.STATIC_DIR = path.join(os.tmpdir(), "dn-dist-does-not-exist");
  ({ app, teardown } = await setupApp());
});
after(() => teardown());

test("sin frontend compilado la raíz responde que la API funciona", async () => {
  const res = await request(app).get("/");
  assert.equal(res.status, 200);
  assert.equal(res.text, "API is running!");
});

test("las rutas desconocidas dan 404 en lugar de un error 500", async () => {
  assert.equal((await request(app).get("/charts")).status, 404);
});
