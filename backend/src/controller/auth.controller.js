import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../libs/jwt.js";

const isProduction = process.env.NODE_ENV === "production";
// Con el frontend en otro dominio por HTTPS (p. ej. Render) la cookie debe
// ser secure + sameSite none para que el navegador la envíe, aunque no se
// haya definido NODE_ENV=production.
const crossSite = isProduction || /^https:\/\//i.test(process.env.FRONTEND_URL || "");

// Configuración de la cookie según el entorno.
// secure + sameSite none solo con HTTPS (en local se usa lax).
const cookieOptions = {
  httpOnly: true,
  secure: crossSite,
  sameSite: crossSite ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24 horas
};

const setAuthCookie = (res, token) => {
  res.cookie("authToken", token, cookieOptions);
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    //Check if username and email already exists
    const usernameFound = await User.findOne({ username });
    if (usernameFound) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const emailFound = await User.findOne({ email });
    if (emailFound) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const userSaved = await user.save();
    //Set cookie with auth token
    const token = await createAccessToken({ _id: userSaved._id });
    setAuthCookie(res, token);

    res.status(201).json({
      id: userSaved._id,
      username: userSaved.username,
      email: userSaved.email,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userFound = await User.findOne({ email });

    // Mismo mensaje en todos los casos para no revelar qué emails existen
    const match =
      userFound &&
      !userFound.isDeleted &&
      (await bcrypt.compare(password, userFound.password));

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    //Set cookie with auth token
    const token = await createAccessToken({ _id: userFound._id });
    setAuthCookie(res, token);

    res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

export const logout = async (req, res) => {
  try {
    //Remove cookie with matching options
    res.clearCookie("authToken", cookieOptions);
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    console.error("Error during profile:", error);
    res.status(500).json({ message: "Profile failed" });
  }
};

// La ruta usa el middleware verifyToken, que ya validó el token y cargó req.user
export const verifyToken = (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
  });
};
