import { Router } from "express";
import { saveData, getAllData } from "../controller/data.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { saveDataSchema } from "../schemas/data.schema.js";

const router = Router();

router.get("/savedfiles", verifyToken, getAllData);

router.post("/saveData", verifyToken, validateSchema(saveDataSchema), saveData);

export default router;
