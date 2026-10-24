import { Router } from "express";
import {
  register,
  login,
  logout,
  profile,
  verifyToken,
} from "../controller/auth.controller.js";
import { authRequired } from "../middlewares/auth.middleware.js";
import { rateLimit } from "../middlewares/rateLimit.middleware.js";
import { registrationSchema, loginSchema } from "../schemas/auth.schema.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
const router = Router();

router.get("/", (req, res) => {
  res.send("Auth API");
});

router.post("/register", rateLimit, validateSchema(registrationSchema), register);
router.post("/login", rateLimit, validateSchema(loginSchema), login);
router.post("/logout", logout);
router.get("/verify", authRequired, verifyToken);
router.get("/profile/", authRequired, profile);

export default router;
