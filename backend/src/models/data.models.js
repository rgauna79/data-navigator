import mongoose from "mongoose";

const Schema = mongoose.Schema;

const DataSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sheetName: {
      type: String,
      required: true,
    },
    fileData: {
      type: Object,
      required: true,
    },
  },
  { timestamps: true },
);

// El nombre de hoja es único por usuario, no globalmente. Solo se aplica a
// documentos con dueño: los antiguos sin "owner" no deben bloquear el índice.
DataSchema.index(
  { owner: 1, sheetName: 1 },
  { unique: true, partialFilterExpression: { owner: { $exists: true } } },
);

const DataModel = mongoose.model("Data", DataSchema);

export default DataModel;
