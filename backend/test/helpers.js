import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

export const FRONTEND = "http://localhost:5173";

// Arranca un MongoDB en memoria y carga la app con variables de entorno de test.
// La app se importa dinámicamente porque config.js lee TOKEN_SECRET al cargarse.
export async function setupApp() {
  process.env.TOKEN_SECRET = "test-secret";
  process.env.FRONTEND_URL = FRONTEND;
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  const { default: app } = await import("../src/app.js");
  const { default: User } = await import("../src/models/user.models.js");
  const teardown = async () => {
    await mongoose.disconnect();
    await mongod.stop();
  };
  return { app, User, teardown };
}
