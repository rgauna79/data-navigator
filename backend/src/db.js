import mongoose from "mongoose";
import dotenv from "dotenv";
import DataModel from "./models/data.models.js";
dotenv.config();

const URI = process.env.MONGO_URI;

export const connectDB = async () => {
  try {
    await mongoose.connect(URI);
    console.log(">>> MongoDB is connected");
    // Elimina el antiguo índice único global de sheetName y crea el índice
    // compuesto (owner, sheetName) en bases de datos existentes.
    await DataModel.syncIndexes();
  } catch (error) {
    console.log(error);
  }
};
