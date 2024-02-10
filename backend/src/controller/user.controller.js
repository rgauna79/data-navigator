import User from "../models/user.models.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userId = await User.findOne({ email: email });

    const updatedFields = {};
    // Check if username is provided
    if (username !== undefined) {
      //Check if username exists
      const existingUsername = await User.findOne({ username: username });
      if (existingUsername.username == username) {
      } else if (!existingUsername) {
        updatedFields.username = username;
      } else if (
        existingUsername &&
        existingUsername._id.toString() !== userId
      ) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }
    // Check if email is provided
    if (email !== undefined) {
      //Check if email exists
      const existingEmail = await User.findOne({ email: email });

      if (existingEmail.email == email) {
      } else if (!existingEmail) {
        updatedFields.email = email;
      } else if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Check if password is provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedFields.password = hashedPassword;
    }

    updatedFields.updatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(
      userId._id,
      { $set: updatedFields },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(404).json({ message: error.message });
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
    );

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
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
