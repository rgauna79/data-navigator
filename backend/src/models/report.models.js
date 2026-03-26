import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["statistics", "mostRepeated"],
      required: true,
    },
    sheetName: {
      type: String,
      required: true,
    },
    selectedOptions: {
      type: Object,
      default: {},
    },
    selectedColumns: {
      type: [String],
      default: [],
    },
    // Snapshot del resultado para no recalcular
    resultSummary: {
      type: Object,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", ReportSchema);
