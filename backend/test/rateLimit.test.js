import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../src/middlewares/rateLimit.middleware.js";

test("rateLimit permite peticiones por debajo del límite", () => {
  const req = { ip: "10.0.0.1" };
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  let nextCalls = 0;
  const next = () => nextCalls++;

  for (let i = 0; i < 49; i++) {
    rateLimit(req, res, next);
  }
  assert.equal(res.statusCode, undefined);
  assert.equal(nextCalls, 49);
});

test("rateLimit devuelve 429 al superar el límite", () => {
  const req = { ip: "10.0.0.2" };
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };
  let nextCalls = 0;
  const next = () => nextCalls++;

  for (let i = 0; i < 51; i++) {
    rateLimit(req, res, next);
  }
  assert.equal(res.statusCode, 429);
  assert.equal(nextCalls, 50);
});
