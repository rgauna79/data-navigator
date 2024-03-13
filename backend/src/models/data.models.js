import mongoose from "mongoose";

const Schema = mongoose.Schema;

const DataSchema = new Schema({
  sheetName: {
    type: String,
    required: true,
    unique: true,
  },
  fileData: {
    type: Object,
    required: true,
  },
});

const DataModel = mongoose.model("Data", DataSchema);

export default DataModel;
