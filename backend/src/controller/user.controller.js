import User from "../models/user.models.js";
import bcrypt from "bcryptjs";

const userPublicFields = "-password -isDeleted";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(userPublicFields);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(userPublicFields);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id || req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "User id is required" });
    }

    const { username, email, password } = req.body;
    const updatedFields = {};

    // Verificar unicidad de username, excluyendo al usuario actual
    if (username !== undefined) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername && existingUsername._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Username already exists" });
      }
      updatedFields.username = username;
    }

    // Verificar unicidad de email, excluyendo al usuario actual
    if (email !== undefined) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Email already exists" });
      }
      updatedFields.email = email;
    }

    // Hash de la contraseña solo si se provee
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true },
    ).select(userPublicFields);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const softDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get the current timestamp
    const updatedAt = new Date();

    // Update the user's isDeleted and updatedAt fields
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { isDeleted: true, updatedAt } },
      { new: true },
    ).select(userPublicFields);

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User deleted successfully", user: updatedUser });
  } catch (error) {
    console.error("Error during deleteUser:", error);
    res.status(500).json({ message: "Delete failed" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
