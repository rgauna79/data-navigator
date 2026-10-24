import { test } from "node:test";
import assert from "node:assert/strict";
import { registrationSchema, loginSchema, updateUserSchema } from "../src/schemas/auth.schema.js";

const validUser = { username: "johndoe", email: "john@example.com", password: "123456" };

test("registrationSchema acepta datos válidos", () => {
  const result = registrationSchema.parse(validUser);
  assert.equal(result.username, "johndoe");
});

test("registrationSchema rechaza username corto", () => {
  assert.throws(() =>
    registrationSchema.parse({ ...validUser, username: "ab" })
  );
});

test("registrationSchema rechaza email inválido", () => {
  assert.throws(() =>
    registrationSchema.parse({ ...validUser, email: "not-an-email" })
  );
});

test("registrationSchema rechaza password corto", () => {
  assert.throws(() =>
    registrationSchema.parse({ ...validUser, password: "123" })
  );
});

test("loginSchema acepta credenciales válidas", () => {
  const result = loginSchema.parse({ email: validUser.email, password: validUser.password });
  assert.equal(result.email, validUser.email);
});

test("updateUserSchema permite actualizaciones parciales", () => {
  const result = updateUserSchema.parse({ username: "newname" });
  assert.equal(result.username, "newname");
});
