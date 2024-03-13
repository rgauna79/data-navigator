import { Router } from "express";
import { saveData } from "../controller/data.controller.js";
import { getAllData } from "../controller/data.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";


const router = Router();


router.get("/savedfiles", verifyToken, getAllData)

router.post("/saveData", verifyToken, saveData);

export default router;
