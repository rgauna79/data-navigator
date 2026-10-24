import mongoose from "mongoose";
import dotenv from "dotenv";
import DataModel from "./models/data.models.js";
dotenv.config({ quiet: true });

const URI = process.env.MONGO_URI;

// Las versiones anteriores guardaban el dueño de cada hoja en "createdBy".
// Se copia a "owner" (sin borrar "createdBy", por compatibilidad). Si el
// usuario ya tiene una hoja con ese nombre, se añade un sufijo " (2)", " (3)"...
// porque el nombre es único por usuario. El más antiguo conserva el nombre.
export const migrateLegacyData = async () => {
  const legacy = await DataModel.collection
    .find(
      { owner: { $exists: false }, createdBy: { $exists: true, $ne: null } },
      { projection: { sheetName: 1, createdBy: 1 } }
    )
    .sort({ createdAt: 1, _id: 1 })
    .toArray();

  for (const { _id, sheetName, createdBy } of legacy) {
    let name = sheetName;
    for (let n = 2; await DataModel.exists({ owner: createdBy, sheetName: name }); n++) {
      name = `${sheetName} (${n})`;
    }
    await DataModel.collection.updateOne({ _id }, { $set: { owner: createdBy, sheetName: name } });
  }
  if (legacy.length) console.log(`>>> Migrated ${legacy.length} saved files to the owner field`);
};

// Lanza el error para que el servidor no arranque sin base de datos
export const connectDB = async () => {
  if (!URI) {
    throw new Error(
      "MONGO_URI is not defined. Set it in backend/.env (see backend/.sampleenv)."
    );
  }
  await mongoose.connect(URI);
  console.log(">>> MongoDB is connected");
  await migrateLegacyData();
  // Elimina el antiguo índice único global de sheetName y crea el índice
  // compuesto (owner, sheetName) en bases de datos existentes.
  // Si falla, la app sigue funcionando: los nombres repetidos también se
  // comprueban al guardar y al renombrar.
  try {
    await DataModel.syncIndexes();
  } catch (error) {
    console.error("Could not sync saved file indexes:", error.message);
  }
};
