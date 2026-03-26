import mongoose from "mongoose";

const DataSchema = new mongoose.Schema(
  {
    sheetName: {
      type: String,
      required: true,
    },
    fileData: {
      type: Object,
      required: true,
    },
    // ✅ opcional para compatibilidad con docs viejos sin createdBy
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

const DataModel = mongoose.model("Data", DataSchema);
export default DataModel;