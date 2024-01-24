import { Router } from "express";
import { register, login } from "../controller/auth.controller.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Auth API");
});

router.post("/register", register);
router.post("/login", login);

export default router;
