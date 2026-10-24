import mongoose from "mongoose";
import ReportModel from "../models/report.models.js";

// Documento por encima del límite de 16 MB de MongoDB
const isTooLarge = (error) =>
  error.code === "ERR_OUT_OF_RANGE" || /maximum.*size|too large/i.test(error.message);

// Busca un informe del usuario actual. Responde 404 si no existe o es de otro usuario.
const findOwnedReport = async (req, res, projection) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ message: "Report not found" });
    return null;
  }
  const report = await ReportModel.findOne({ _id: id, createdBy: req.user._id }, projection);
  if (!report) res.status(404).json({ message: "Report not found" });
  return report;
};

// GET /api/reports — lista los informes del usuario (sin las filas de datos;
// se incluyen los encabezados para mostrar los filtros)
export const getAllReports = async (req, res) => {
  try {
    const reports = await ReportModel.find({ createdBy: req.user._id }, { "snapshot.data": 0, resultSummary: 0 })
      .sort({ createdAt: -1 })
      .lean();
    res.json(reports);
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({ message: "Failed to get reports" });
  }
};

// GET /api/reports/:id — informe completo, con los datos para volver a abrirlo
export const getReportById = async (req, res) => {
  try {
    const report = await findOwnedReport(req, res);
    if (report) res.json(report);
  } catch (error) {
    console.error("Error getting report:", error);
    res.status(500).json({ message: "Failed to get report" });
  }
};

// POST /api/reports — guarda un informe (el cuerpo ya está validado)
export const saveReport = async (req, res) => {
  try {
    const report = await ReportModel.create({ ...req.body, createdBy: req.user._id });
    const { snapshot, ...summary } = report.toObject();
    res.status(201).json({ message: "Report saved successfully", report: summary });
  } catch (error) {
    if (isTooLarge(error)) {
      return res.status(413).json({ message: "Report is too large to save" });
    }
    console.error("Error saving report:", error);
    res.status(500).json({ message: "Failed to save report" });
  }
};

// DELETE /api/reports/:id
export const deleteReport = async (req, res) => {
  try {
    const report = await findOwnedReport(req, res, { _id: 1 });
    if (!report) return;
    await ReportModel.deleteOne({ _id: report._id });
    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Failed to delete report" });
  }
};
