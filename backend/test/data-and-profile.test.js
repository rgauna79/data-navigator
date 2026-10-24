import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupApp } from "./helpers.js";

let app, teardown;

before(async () => {
  // Límite pequeño para probar el error 413 sin enviar megas de datos
  process.env.JSON_LIMIT = "2kb";
  ({ app, teardown } = await setupApp());
});
after(() => teardown());

async function signup(username) {
  const agent = request.agent(app);
  const res = await agent
    .post("/api/auth/register")
    .send({ username, email: `${username}@example.com`, password: "secret123" });
  assert.equal(res.status, 201);
  return agent;
}

test("se puede actualizar el perfil sin enviar contraseña", async () => {
  const agent = await signup("ivan");
  const res = await agent
    .put("/api/users/profile")
    .send({ username: "ivan2", email: "ivan@example.com" });
  assert.equal(res.status, 200);
  assert.equal(res.body.username, "ivan2");

  // La contraseña anterior sigue funcionando
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "ivan@example.com", password: "secret123" });
  assert.equal(login.status, 200);
});

test("los errores de validación se devuelven en `message`", async () => {
  const agent = await signup("judy");
  const res = await agent.put("/api/users/profile").send({ password: "123" });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /at least 6/);
});

test("saveData valida el cuerpo", async () => {
  const agent = await signup("ken");
  const res = await agent.post("/api/data/saveData").send({ sheetName: "", fileData: "x" });
  assert.equal(res.status, 400);
  assert.ok(res.body.message);
});

test("una hoja por encima del límite devuelve 413 con un mensaje claro", async () => {
  const agent = await signup("liam");
  const fileData = [["Col"], ...Array.from({ length: 500 }, (_, i) => [`row-${i}`])];
  const res = await agent.post("/api/data/saveData").send({ sheetName: "Big", fileData });
  assert.equal(res.status, 413);
  assert.match(res.body.message, /too large/);
});
