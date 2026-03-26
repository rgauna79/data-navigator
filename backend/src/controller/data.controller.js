import DataModel from "../models/data.models.js";

export const saveData = async (req, res) => {
  const { sheetName, fileData } = req.body;
  const userId = req.user?._id;

  try {
    // Buscar por sheetName (con o sin createdBy para compatibilidad)
    const query = userId
      ? { sheetName, createdBy: userId }
      : { sheetName };

    const existingData = await DataModel.findOne(query);

    if (existingData) {
      existingData.fileData = fileData;
      if (userId) existingData.createdBy = userId;
      await existingData.save();
      return res.status(200).json({ message: "Data updated successfully" });
    } else {
      const saveObj = { sheetName, fileData };
      if (userId) saveObj.createdBy = userId;
      const saved = await DataModel.create(saveObj);
      return res.status(201).json({ message: "Data saved successfully", data: saved });
    }
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
};

export const getAllData = async (req, res) => {
  const userId = req.user?._id;

  try {
    // ✅ Si hay userId trae los suyos, si no trae todos (compatibilidad)
    const query = userId ? { createdBy: userId } : {};
    const dataFound = await DataModel.find(query).sort({ updatedAt: -1 });

    // ✅ Siempre devuelve { data: [...] } para consistencia
    return res.status(200).json({ data: dataFound });
  } catch (error) {
    console.error("Error getting data:", error);
    res.status(500).json({ error: "Failed to get data" });
  }
};

export const deleteData = async (req, res) => {
  const userId = req.user?._id;
  try {
    const query = { _id: req.params.id };
    if (userId) query.createdBy = userId;
    const deleted = await DataModel.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete data" });
  }
};