import { Router } from "express";
import {
  register,
  login,
  logout,
  profile,
  verifyToken,
} from "../controller/auth.controller.js";
// import { verifyToken } from "../middlewares/auth.middleware.js";
import { registrationSchema, loginSchema } from "../schemas/auth.schema.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
const router = Router();

router.get("/", (req, res) => {
  res.send("Auth API");
});

router.post("/register", validateSchema(registrationSchema), register);
router.post("/login", validateSchema(loginSchema), login);
router.post("/logout", logout);
router.get("/verify", verifyToken);
router.get("/profile/", verifyToken, profile);

export default router;
