import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  deleteUser,
} from "../controller/user.controller.js";
import { validateSchema } from "../middlewares/validate.middleware.js";
import { updateUserSchema } from "../schemas/auth.schema.js";

const router = Router();

router.get("/", verifyToken, getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.post(
  "/update/:id",
  verifyToken,
  validateSchema(updateUserSchema),
  updateUser,
);
router.post("/delete/:id", verifyToken, softDeleteUser); // Soft delete
router.delete("/delete/:id", verifyToken, deleteUser); // Hard delete

// Perfil del usuario autenticado
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
  });
});
router.put("/profile", verifyToken, validateSchema(updateUserSchema), updateUser);

export default router;
