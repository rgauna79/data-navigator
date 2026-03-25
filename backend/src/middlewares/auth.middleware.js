import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import User from "../models/user.models.js";

export const verifyToken = async (req, res, next) => {
  try {
    const { authToken } = req.cookies;
    if (!authToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // jwt.verify(authToken, TOKEN_SECRET, async (err, user) => {
    //   if (err) {
    //     return res.status(401).json({ message: "Unauthorized" });
    //   }
    const decodedToken = jwt.verify(authToken, TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized, user not found" });
    }
    next();
    // return res.json({
    //   id: userFound._id,
    //   username: userFound.username,
    //   email: userFound.email,
    // });
  } catch (error) {
    console.error("Error during token verification:", error);
    res.status(500).json({ message: "Token verification failed" });
  }
};

export const authRequired = (req, res, next) => {
  const { authToken } = req.cookies;

  if (!authToken) return res.status(401).json({ message: "No token, authorization denied" });

  jwt.verify(authToken, TOKEN_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    
    req.user = user; // Guardamos los datos del usuario en la petición
    next();
  });
};
