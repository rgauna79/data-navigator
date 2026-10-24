import { Router } from "express";
import { verifyToken, requireAdmin } from "../middlewares/auth.middleware.js";
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

// Perfil del usuario autenticado.
// Debe declararse antes de "/:id" para que "profile" no se tome como id.
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
  });
});
router.put("/profile", verifyToken, validateSchema(updateUserSchema), updateUser);

// Administración de usuarios: solo admins
router.get("/", verifyToken, requireAdmin, getAllUsers);
router.get("/:id", verifyToken, requireAdmin, getUserById);
router.post(
  "/update/:id",
  verifyToken,
  requireAdmin,
  validateSchema(updateUserSchema),
  updateUser,
);
router.post("/delete/:id", verifyToken, requireAdmin, softDeleteUser); // Soft delete
router.delete("/delete/:id", verifyToken, requireAdmin, deleteUser); // Hard delete

export default router;
