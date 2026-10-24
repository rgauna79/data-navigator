import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { setupApp } from "./helpers.js";

let app, User, teardown;

before(async () => {
  ({ app, User, teardown } = await setupApp());
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

const report = {
  name: "Sales by region",
  type: "group",
  sheetName: "Sales",
  selectedOptions: { 1: "NORTH" },
  snapshot: {
    headers: ["Region", "Amount"],
    data: [["NORTH", "10"], ["SOUTH", "5"]],
    config: { groupIdx: 0, groupType: "category", metric: "sum", valueIdx: 1, topN: 10 },
    columnTypes: [{ type: "text" }, { type: "numeric" }],
  },
};

test("guarda, lista, abre y borra informes propios", async () => {
  const agent = await signup("rita");
  const saved = await agent.post("/api/reports").send(report);
  assert.equal(saved.status, 201);
  assert.equal(saved.body.report.snapshot, undefined);
  const id = saved.body.report._id;

  const list = await agent.get("/api/reports");
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1);
  assert.equal(list.body[0].name, "Sales by region");
  assert.equal(list.body[0].snapshot.data, undefined);
  assert.deepEqual(list.body[0].snapshot.headers, ["Region", "Amount"]);

  const full = await agent.get(`/api/reports/${id}`);
  assert.equal(full.status, 200);
  assert.deepEqual(full.body.snapshot.data, report.snapshot.data);
  assert.deepEqual(full.body.selectedOptions, { 1: "NORTH" });

  assert.equal((await agent.delete(`/api/reports/${id}`)).status, 200);
  assert.equal((await agent.get(`/api/reports/${id}`)).status, 404);
});

test("los informes de otro usuario no se ven ni se borran", async () => {
  const owner = await signup("sara");
  const other = await signup("tomas");
  const { body } = await owner.post("/api/reports").send(report);
  const id = body.report._id;

  assert.equal((await other.get("/api/reports")).body.length, 0);
  assert.equal((await other.get(`/api/reports/${id}`)).status, 404);
  assert.equal((await other.delete(`/api/reports/${id}`)).status, 404);
  assert.equal((await owner.get(`/api/reports/${id}`)).status, 200);
});

test("valida el informe y exige sesión", async () => {
  assert.equal((await request(app).get("/api/reports")).status, 401);
  const agent = await signup("ursula");
  assert.equal((await agent.post("/api/reports").send({ ...report, name: "" })).status, 400);
  assert.equal((await agent.post("/api/reports").send({ ...report, type: "other" })).status, 400);
  const pivot = { rowIdx: 0, rowType: "category", colIdx: 1, colType: "category", metric: "count", valueIdx: null };
  const saved = await agent.post("/api/reports").send({ ...report, type: "pivot", snapshot: { ...report.snapshot, config: pivot } });
  assert.equal(saved.status, 201);
  const opened = await agent.get(`/api/reports/${saved.body.report._id}`);
  assert.equal(opened.body.type, "pivot");
  assert.deepEqual(opened.body.snapshot.config, pivot);
  const { snapshot, ...noData } = report;
  assert.equal((await agent.post("/api/reports").send(noData)).status, 400);
  assert.equal((await agent.get("/api/reports/not-an-id")).status, 404);
});

test("migra los archivos guardados con createdBy a owner", async () => {
  const user = await User.create({ username: "vera", email: "vera@example.com", password: "x" });
  const { default: DataModel } = await import("../src/models/data.models.js");
  const { migrateLegacyData } = await import("../src/db.js");
  const rows = [["A"], ["1"]];
  // Documentos como los guardaba la versión anterior (sin owner)
  await DataModel.collection.insertMany([
    { sheetName: "Old", fileData: rows, createdBy: user._id, createdAt: new Date(1) },
    { sheetName: "Old", fileData: rows, createdBy: user._id, createdAt: new Date(2) },
    { sheetName: "Orphan", fileData: rows },
  ]);

  await migrateLegacyData();

  const mine = await DataModel.find({ owner: user._id }).sort({ createdAt: 1 }).lean();
  assert.deepEqual(mine.map((d) => d.sheetName), ["Old", "Old (2)"]);
  // createdBy se conserva por compatibilidad
  assert.ok(mine.every((d) => String(d.createdBy) === String(user._id)));
  assert.equal(await DataModel.countDocuments({ sheetName: "Orphan", owner: { $exists: false } }), 1);
  assert.ok(mongoose.isValidObjectId(mine[0].owner));
});
