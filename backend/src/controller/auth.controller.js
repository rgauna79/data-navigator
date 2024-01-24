import User from "../models/user.models.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const userSaved = await user.save();
    res.json(userSaved);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    res.json(userFound);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
