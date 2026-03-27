import DataModel from "../models/data.models.js";

export const saveData = async (req, res) => {
  const { sheetName, fileData, overwrite = false } = req.body;
  const userId = req.user?._id;

  try {
    const query = userId ? { sheetName, createdBy: userId } : { sheetName };
    const existingData = await DataModel.findOne(query);

    if (existingData) {
      if (overwrite) {
        // ✅ Sobrescribir con los datos nuevos
        existingData.fileData = fileData;
        await existingData.save();
        return res
          .status(200)
          .json({ message: "Data overwritten successfully" });
      } else {
        // ✅ Guardar como copia nueva con nombre modificado
        const timestamp = new Date().toISOString().slice(0, 10);
        const newName = `${sheetName} (${timestamp})`;
        const saveObj = { sheetName: newName, fileData };
        if (userId) saveObj.createdBy = userId;
        await DataModel.create(saveObj);
        return res
          .status(201)
          .json({ message: "Saved as new copy", sheetName: newName });
      }
    } else {
      // No existe — crear nuevo
      const saveObj = { sheetName, fileData };
      if (userId) saveObj.createdBy = userId;
      await DataModel.create(saveObj);
      return res.status(201).json({ message: "Data saved successfully" });
    }
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
};

export const getAllData = async (req, res) => {
  const userId = req.user?._id;
  try {
    const query = userId ? { createdBy: userId } : {};
    const dataFound = await DataModel.find(query).sort({ updatedAt: -1 });
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
