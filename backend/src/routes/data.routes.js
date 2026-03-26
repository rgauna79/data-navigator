import { Router } from "express";
import { saveData, getAllData, deleteData } from "../controller/data.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/savedfiles",    verifyToken, getAllData);
router.post("/saveData",     verifyToken, saveData);
router.delete("/:id",        verifyToken, deleteData); // ✅ nuevo: poder borrar sheets

export default router;