import User from "../models/user.models.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../libs/jwt.js";
import { TOKEN_SECRET } from "../config.js";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

// Configuración de la cookie según el entorno.
// secure + sameSite none solo en producción (requieren HTTPS).
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
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

    if (!userFound) {
      return res.status(400).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, userFound.password);

    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
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

export const verifyToken = async (req, res) => {
  const { authToken } = req.cookies;
  if (!authToken) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(authToken, TOKEN_SECRET, async (err, user) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });

    const userFound = await User.findById(user._id);
    if (!userFound) return res.status(401).json({ message: "Unauthorized" });

    return res.json({
      id: userFound._id,
      username: userFound.username,
      email: userFound.email,
    });
  });
};
