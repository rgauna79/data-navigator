import mongoose from "mongoose";
import dotenv from "dotenv";
import DataModel from "./models/data.models.js";
dotenv.config();

const URI = process.env.MONGO_URI;

// Lanza el error para que el servidor no arranque sin base de datos
export const connectDB = async () => {
  if (!URI) {
    throw new Error(
      "MONGO_URI is not defined. Set it in backend/.env (see backend/.sampleenv)."
    );
  }
  await mongoose.connect(URI);
  console.log(">>> MongoDB is connected");
  // Elimina el antiguo índice único global de sheetName y crea el índice
  // compuesto (owner, sheetName) en bases de datos existentes.
  await DataModel.syncIndexes();
};
