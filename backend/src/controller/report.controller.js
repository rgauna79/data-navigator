import ReportModel from "../models/report.models.js";
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";

// Helper: extraer userId del cookie
const getUserId = (req) => {
  const { authToken } = req.cookies;
  if (!authToken) return null;
  try {
    const decoded = jwt.verify(authToken, TOKEN_SECRET);
    return decoded._id;
  } catch {
    return null;
  }
};

// GET /api/reports — listar reportes del usuario logueado
export const getAllReports = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const reports = await ReportModel.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .select("-resultSummary"); // omitir el snapshot pesado en el listado

    return res.status(200).json(reports);
  } catch (error) {
    console.error("Error getting reports:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
};

// GET /api/reports/:id — obtener un reporte completo
export const getReportById = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const report = await ReportModel.findOne({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!report) return res.status(404).json({ message: "Report not found" });

    return res.status(200).json(report);
  } catch (error) {
    console.error("Error getting report:", error);
    res.status(500).json({ error: "Failed to get report" });
  }
};

// POST /api/reports — guardar un reporte
export const saveReport = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const {
      name,
      type,
      sheetName,
      selectedOptions,
      selectedColumns,
      resultSummary,
    } = req.body;

    if (!name || !type || !sheetName) {
      return res
        .status(400)
        .json({ message: "name, type and sheetName are required" });
    }

    const report = await ReportModel.create({
      name,
      type,
      sheetName,
      selectedOptions: selectedOptions || {},
      selectedColumns: selectedColumns || [],
      resultSummary: resultSummary || {},
      createdBy: userId,
    });

    return res
      .status(201)
      .json({ message: "Report saved successfully", report });
  } catch (error) {
    console.error("Error saving report:", error);
    res.status(500).json({ error: "Failed to save report" });
  }
};

// DELETE /api/reports/:id — eliminar un reporte
export const deleteReport = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const deleted = await ReportModel.findOneAndDelete({
      _id: req.params.id,
      createdBy: userId,
    });

    if (!deleted) return res.status(404).json({ message: "Report not found" });

    return res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};
