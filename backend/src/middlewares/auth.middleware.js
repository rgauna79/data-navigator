import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import User from "../models/user.models.js";

// ✅ FIX: ahora setea req.user para que los controllers puedan usarlo
export const verifyToken = async (req, res, next) => {
  try {
    const { authToken } = req.cookies;
    if (!authToken) {
      return res.status(401).json({ message: "Unauthorized - no token" });
    }

    const decodedToken = jwt.verify(authToken, TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized - user not found" });
    }

    req.user = user; // ✅ setear req.user para los controllers
    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ message: "Unauthorized - invalid token" });
  }
};

export const authRequired = (req, res, next) => {
  const { authToken } = req.cookies;

  if (!authToken) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  jwt.verify(authToken, TOKEN_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// Solo administradores. Debe usarse después de verifyToken
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
