import mongoose from "mongoose";
import DataModel from "../models/data.models.js";

const isDuplicateKey = (error) => error.code === 11000;

// Documento por encima del límite de 16 MB de MongoDB
const isTooLarge = (error) =>
  error.code === "ERR_OUT_OF_RANGE" || /maximum.*size|too large/i.test(error.message);

// Busca un archivo guardado del usuario actual. Responde 404 si no existe o es de otro usuario.
const findOwnedFile = async (req, res, projection) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ message: "Saved file not found" });
    return null;
  }
  const file = await DataModel.findOne({ _id: id, owner: req.user._id }, projection);
  if (!file) res.status(404).json({ message: "Saved file not found" });
  return file;
};

export const saveData = async (req, res) => {
  const { sheetName, fileData, overwrite } = req.body;

  try {
    const existingData = await DataModel.findOne(
      { owner: req.user._id, sheetName },
      { _id: 1 },
    );

    if (existingData) {
      // No se sobrescribe sin confirmación explícita del usuario
      if (!overwrite) {
        return res.status(409).json({
          message: `A saved file named "${sheetName}" already exists.`,
          code: "ALREADY_EXISTS",
        });
      }
      await DataModel.updateOne({ _id: existingData._id }, { fileData });
      return res.status(200).json({ id: existingData._id, message: "Data updated successfully" });
    }

    const created = await DataModel.create({ owner: req.user._id, sheetName, fileData });
    return res.status(201).json({ id: created._id, message: "Data saved successfully" });
  } catch (error) {
    if (isTooLarge(error)) {
      return res.status(413).json({ message: "Sheet is too large to save" });
    }
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Failed to save data" });
  }
};

// Lista solo los metadatos; el contenido se pide al abrir cada archivo
export const getAllData = async (req, res) => {
  try {
    const files = await DataModel.aggregate([
      { $match: { owner: req.user._id } },
      {
        $project: {
          sheetName: 1,
          createdAt: 1,
          updatedAt: 1,
          // La primera fila son los encabezados
          rowCount: {
            $cond: [{ $isArray: "$fileData" }, { $max: [{ $subtract: [{ $size: "$fileData" }, 1] }, 0] }, 0],
          },
          columnCount: {
            $cond: [
              { $isArray: { $arrayElemAt: ["$fileData", 0] } },
              { $size: { $arrayElemAt: ["$fileData", 0] } },
              0,
            ],
          },
        },
      },
      { $sort: { updatedAt: -1, _id: -1 } },
    ]);
    return res.status(200).json(files);
  } catch (error) {
    console.error("Error getting data:", error);
    res.status(500).json({ message: "Failed to get data" });
  }
};

export const getDataById = async (req, res) => {
  try {
    const file = await findOwnedFile(req, res);
    if (file) res.json(file);
  } catch (error) {
    console.error("Error getting saved file:", error);
    res.status(500).json({ message: "Failed to get saved file" });
  }
};

export const renameData = async (req, res) => {
  try {
    const file = await findOwnedFile(req, res, { fileData: 0 });
    if (!file) return;
    const duplicate = await DataModel.exists({
      owner: req.user._id,
      sheetName: req.body.sheetName,
      _id: { $ne: file._id },
    });
    if (duplicate) {
      return res.status(409).json({
        message: `A saved file named "${req.body.sheetName}" already exists.`,
        code: "ALREADY_EXISTS",
      });
    }
    file.sheetName = req.body.sheetName;
    await file.save();
    res.json({ id: file._id, sheetName: file.sheetName, updatedAt: file.updatedAt });
  } catch (error) {
    if (isDuplicateKey(error)) {
      return res.status(409).json({
        message: `A saved file named "${req.body.sheetName}" already exists.`,
        code: "ALREADY_EXISTS",
      });
    }
    console.error("Error renaming saved file:", error);
    res.status(500).json({ message: "Failed to rename saved file" });
  }
};

export const deleteData = async (req, res) => {
  try {
    const file = await findOwnedFile(req, res, { _id: 1 });
    if (!file) return;
    await DataModel.deleteOne({ _id: file._id });
    res.json({ message: "Saved file deleted" });
  } catch (error) {
    console.error("Error deleting saved file:", error);
    res.status(500).json({ message: "Failed to delete saved file" });
  }
};
