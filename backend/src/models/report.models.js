import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // "groupBy" es el tipo de las versiones anteriores; los informes nuevos
    // de agrupación usan "group"
    type: {
      type: String,
      enum: ["statistics", "mostRepeated", "group", "groupBy"],
      required: true,
    },
    sheetName: {
      type: String,
      default: "",
    },
    selectedOptions: {
      type: Object,
      default: {},
    },
    selectedColumns: {
      type: [String],
      default: [],
    },
    // Copia de los datos y la configuración del informe para volver a
    // abrirlo sin tener el archivo original: { headers, data, config, columnTypes }
    snapshot: {
      type: Object,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, minimize: false }
);

export default mongoose.model("Report", ReportSchema);
