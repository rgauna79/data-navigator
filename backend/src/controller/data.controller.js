import DataModel from "../models/data.models.js";

export const saveData = async (req, res) => {
  const { sheetName, fileData } = req.body;

  try {
    const existingData = await DataModel.findOne({
      owner: req.user._id,
      sheetName,
    });

    if (existingData) {
      existingData.fileData = fileData;
      await existingData.save();
      return res.status(200).json({ message: "Data updated successfully" });
    }

    await DataModel.create({ owner: req.user._id, sheetName, fileData });
    return res.status(201).json({ message: "Data saved successfully" });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: "Failed to save data" });
  }
};

export const getAllData = async (req, res) => {
  try {
    const dataFound = await DataModel.find({ owner: req.user._id });
    return res.status(200).json(dataFound);
  } catch (error) {
    console.error("Error getting data:", error);
    res.status(500).json({ message: "Failed to get data" });
  }
};
