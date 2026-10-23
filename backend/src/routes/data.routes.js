import { Router } from "express";
import {
  saveData,
  getAllData,
  getDataById,
  renameData,
  deleteData,
} from "../controller/data.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { saveDataSchema, renameDataSchema } from "../schemas/data.schema.js";

const router = Router();

router.get("/savedfiles", verifyToken, getAllData);
router.get("/savedfiles/:id", verifyToken, getDataById);
router.patch("/savedfiles/:id", verifyToken, validateSchema(renameDataSchema), renameData);
router.delete("/savedfiles/:id", verifyToken, deleteData);

router.post("/saveData", verifyToken, validateSchema(saveDataSchema), saveData);

export default router;
