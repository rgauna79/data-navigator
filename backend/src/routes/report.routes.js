import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getAllReports,
  getReportById,
  saveReport,
  deleteReport,
} from "../controller/report.controller.js";

const router = Router();

router.get("/", verifyToken, getAllReports);
router.get("/:id", verifyToken, getReportById);
router.post("/", verifyToken, saveReport);
router.delete("/:id", verifyToken, deleteReport);

export default router;
