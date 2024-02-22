import DataModel from "../models/data.models.js";

export const saveData = async (req, res) => {
  const { sheetName, fileData } = req.body;

  try {

    const existingData = await DataModel.findOne({ sheetName });

    if (existingData) {
      existingData.fileData = fileData;
      await existingData.save();
      return res.status(200).json({ message: "Data updated successfully" });
    } else {

      const saveData = await DataModel.create({ sheetName, fileData });
      await saveData.save();
      return res.status(200).json({ message: "Data saved successfully" });
    }
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
};

export const getAllData = async (req, res) => {

  try {
    const dataFound = await DataModel.find();
    if (dataFound) {
      return res.status(200).json(dataFound);
    }    
  } catch (error) {
    console.error("Error getting data:", error);
    res.status(500).json({ error: "Failed to get data" });
  }
}
