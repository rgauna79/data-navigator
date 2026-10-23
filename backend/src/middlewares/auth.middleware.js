import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import User from "../models/user.models.js";

export const verifyToken = async (req, res, next) => {
  try {
    const { authToken } = req.cookies;
    if (!authToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(authToken, TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);

    // Usuarios eliminados (soft delete) no pueden seguir usando su sesión
    if (!user || user.isDeleted) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    // Token inválido o expirado
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Alias por compatibilidad con rutas existentes
export const authRequired = verifyToken;

// Debe usarse después de verifyToken
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
