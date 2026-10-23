import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupApp } from "./helpers.js";

let app, teardown;

before(async () => {
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

const rows = [
  ["Name", "Amount"],
  ["a", "1"],
  ["b", "2"],
  ["c", "3"],
];

test("la lista devuelve metadatos sin el contenido", async () => {
  const agent = await signup("mia");
  await agent.post("/api/data/saveData").send({ sheetName: "Sales", fileData: rows });

  const list = (await agent.get("/api/data/savedfiles")).body;
  assert.equal(list.length, 1);
  assert.equal(list[0].sheetName, "Sales");
  assert.equal(list[0].rowCount, 3);
  assert.equal(list[0].columnCount, 2);
  assert.ok(list[0].updatedAt);
  assert.equal(list[0].fileData, undefined);
});

test("guardar con un nombre existente pide confirmación (409) y sobrescribe con overwrite", async () => {
  const agent = await signup("noah");
  await agent.post("/api/data/saveData").send({ sheetName: "Q1", fileData: rows });

  const newRows = [["Name"], ["z"]];
  const conflict = await agent.post("/api/data/saveData").send({ sheetName: "Q1", fileData: newRows });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.code, "ALREADY_EXISTS");

  const ok = await agent
    .post("/api/data/saveData")
    .send({ sheetName: "Q1", fileData: newRows, overwrite: true });
  assert.equal(ok.status, 200);

  const list = (await agent.get("/api/data/savedfiles")).body;
  assert.equal(list.length, 1);
  const file = (await agent.get(`/api/data/savedfiles/${list[0]._id}`)).body;
  assert.deepEqual(file.fileData, newRows);
});

test("renombrar valida duplicados y nombres vacíos", async () => {
  const agent = await signup("olga");
  const a = (await agent.post("/api/data/saveData").send({ sheetName: "A", fileData: rows })).body.id;
  await agent.post("/api/data/saveData").send({ sheetName: "B", fileData: rows });

  assert.equal((await agent.patch(`/api/data/savedfiles/${a}`).send({ sheetName: "B" })).status, 409);
  assert.equal((await agent.patch(`/api/data/savedfiles/${a}`).send({ sheetName: "  " })).status, 400);

  const renamed = await agent.patch(`/api/data/savedfiles/${a}`).send({ sheetName: "  A2 " });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.sheetName, "A2");
});

test("borrar elimina el archivo; ids inválidos devuelven 404", async () => {
  const agent = await signup("pablo");
  const id = (await agent.post("/api/data/saveData").send({ sheetName: "Tmp", fileData: rows })).body.id;

  assert.equal((await agent.delete(`/api/data/savedfiles/${id}`)).status, 200);
  assert.equal((await agent.get(`/api/data/savedfiles/${id}`)).status, 404);
  assert.equal((await agent.get("/api/data/savedfiles")).body.length, 0);
  assert.equal((await agent.get("/api/data/savedfiles/not-an-id")).status, 404);
});
