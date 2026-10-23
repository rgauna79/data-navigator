import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { setupApp, FRONTEND } from "./helpers.js";

let app, User, teardown;

before(async () => {
  ({ app, User, teardown } = await setupApp());
});
after(() => teardown());

// Registra un usuario y devuelve un agente con su cookie de sesión
async function signup(username) {
  const agent = request.agent(app);
  const res = await agent
    .post("/api/auth/register")
    .send({ username, email: `${username}@example.com`, password: "secret123" });
  assert.equal(res.status, 201);
  return { agent, id: res.body.id };
}

test("un usuario normal no puede listar, editar ni borrar a otros usuarios", async () => {
  const alice = await signup("alice");
  const bob = await signup("bob");

  assert.equal((await alice.agent.get("/api/users")).status, 403);
  assert.equal((await alice.agent.get(`/api/users/${bob.id}`)).status, 403);
  assert.equal(
    (await alice.agent.post(`/api/users/update/${bob.id}`).send({ username: "hacked" })).status,
    403,
  );
  assert.equal((await alice.agent.post(`/api/users/delete/${bob.id}`)).status, 403);
  assert.equal((await alice.agent.delete(`/api/users/delete/${bob.id}`)).status, 403);

  const bobDb = await User.findById(bob.id);
  assert.equal(bobDb.username, "bob");
  assert.equal(bobDb.isDeleted, false);
});

test("un admin sí puede listar usuarios, sin exponer contraseñas", async () => {
  const admin = await signup("admin1");
  await User.findByIdAndUpdate(admin.id, { role: "admin" });

  const res = await admin.agent.get("/api/users");
  assert.equal(res.status, 200);
  assert.ok(res.body.length > 0);
  assert.ok(res.body.every((u) => u.password === undefined));
});

test("GET /api/users/profile devuelve el perfil propio", async () => {
  const carol = await signup("carol");
  const res = await carol.agent.get("/api/users/profile");
  assert.equal(res.status, 200);
  assert.equal(res.body.username, "carol");
});

test("cada usuario solo ve y sobrescribe sus propios archivos guardados", async () => {
  const dave = await signup("dave");
  const erin = await signup("erin");

  const daveRows = [["Name"], ["dave-row"]];
  const erinRows = [["Name"], ["erin-row"]];
  assert.equal(
    (await dave.agent.post("/api/data/saveData").send({ sheetName: "Sheet1", fileData: daveRows })).status,
    201,
  );
  // Mismo nombre de hoja: no debe pisar la de dave
  assert.equal(
    (await erin.agent.post("/api/data/saveData").send({ sheetName: "Sheet1", fileData: erinRows })).status,
    201,
  );

  const daveFiles = (await dave.agent.get("/api/data/savedfiles")).body;
  const erinFiles = (await erin.agent.get("/api/data/savedfiles")).body;
  assert.equal(daveFiles.length, 1);
  assert.equal(erinFiles.length, 1);
  const daveFile = (await dave.agent.get(`/api/data/savedfiles/${daveFiles[0]._id}`)).body;
  const erinFile = (await erin.agent.get(`/api/data/savedfiles/${erinFiles[0]._id}`)).body;
  assert.deepEqual(daveFile.fileData, daveRows);
  assert.deepEqual(erinFile.fileData, erinRows);

  // Nadie puede leer, renombrar ni borrar un archivo ajeno
  const daveId = daveFiles[0]._id;
  assert.equal((await erin.agent.get(`/api/data/savedfiles/${daveId}`)).status, 404);
  assert.equal(
    (await erin.agent.patch(`/api/data/savedfiles/${daveId}`).send({ sheetName: "x" })).status,
    404,
  );
  assert.equal((await erin.agent.delete(`/api/data/savedfiles/${daveId}`)).status, 404);
  assert.equal((await dave.agent.get(`/api/data/savedfiles/${daveId}`)).status, 200);
});

test("login usa el mismo mensaje para email inexistente y contraseña incorrecta", async () => {
  await signup("frank");
  const wrongEmail = await request(app)
    .post("/api/auth/login")
    .send({ email: "nobody@example.com", password: "secret123" });
  const wrongPassword = await request(app)
    .post("/api/auth/login")
    .send({ email: "frank@example.com", password: "wrongpass" });

  assert.equal(wrongEmail.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongEmail.body.message, wrongPassword.body.message);
});

test("un usuario eliminado (soft delete) pierde la sesión y no puede volver a entrar", async () => {
  const gina = await signup("gina");
  assert.equal((await gina.agent.get("/api/auth/verify")).status, 200);

  await User.findByIdAndUpdate(gina.id, { isDeleted: true });

  assert.equal((await gina.agent.get("/api/auth/verify")).status, 401);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: "gina@example.com", password: "secret123" });
  assert.equal(login.status, 401);
});

test("peticiones que modifican estado desde otro origen se rechazan (CSRF)", async () => {
  const hank = await signup("hank");

  const evil = await hank.agent
    .put("/api/users/profile")
    .set("Origin", "https://evil.example")
    .send({ username: "pwned" });
  assert.equal(evil.status, 403);

  const legit = await hank.agent
    .put("/api/users/profile")
    .set("Origin", FRONTEND)
    .send({ username: "hank2" });
  assert.equal(legit.status, 200);
  assert.equal(legit.body.username, "hank2");
});
