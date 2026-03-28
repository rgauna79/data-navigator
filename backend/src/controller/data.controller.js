import DataModel from "../models/data.models.js";

export const saveData = async (req, res) => {
  const { sheetName, fileData, overwrite = false } = req.body;
  const userId = req.user?._id;

  try {
    // 1. VALIDACIÓN DE SEGURIDAD: Prevenir que crashee MongoDB (Límite 16MB)
    const sizeInBytes = Buffer.byteLength(JSON.stringify(fileData));
    const sizeInMB = sizeInBytes / (1024 * 1024);

    // Si pesa más de 12MB en JSON, es riesgoso para un solo documento BSON
    if (sizeInMB > 12) {
      return res.status(413).json({
        error: `Dataset is too large (${sizeInMB.toFixed(
          1
        )}MB). Maximum allowed for DB storage is 12MB. Please reduce rows or columns.`,
      });
    }

    const query = userId ? { sheetName, createdBy: userId } : { sheetName };

    // 2. OPTIMIZACIÓN: findOneAndUpdate no carga el documento viejo a la RAM
    if (overwrite) {
      const updated = await DataModel.findOneAndUpdate(
        query,
        { fileData },
        { new: true, lean: true } // lean() salva muchísima memoria
      );
      if (updated) {
        return res
          .status(200)
          .json({ message: "Data overwritten successfully" });
      }
    }

    // 3. Si no existe o se pidió guardar como copia nueva
    const existingData = await DataModel.findOne(query).select("_id").lean();

    if (existingData && !overwrite) {
      const timestamp = new Date().toISOString().slice(0, 10);
      const newName = `${sheetName} (${timestamp})`;
      await DataModel.create({
        sheetName: newName,
        fileData,
        createdBy: userId,
      });
      return res
        .status(201)
        .json({ message: "Saved as new copy", sheetName: newName });
    }

    await DataModel.create({ sheetName, fileData, createdBy: userId });
    return res.status(201).json({ message: "Data saved successfully" });
  } catch (error) {
    console.error("Error saving data:", error);
    // Atrapamos el error específico de MongoDB por si el documento sigue siendo muy grande
    if (error.message && error.message.includes("16777216")) {
      return res
        .status(413)
        .json({
          error: "Dataset exceeds MongoDB maximum document size limit.",
        });
    }
    res.status(500).json({ error: "Failed to save data" });
  }
};

export const getAllData = async (req, res) => {
  const userId = req.user?._id;
  try {
    const query = userId ? { createdBy: userId } : {};
    // OPTIMIZACIÓN CRÍTICA: .lean() es obligatorio aquí para no colapsar el servidor
    // cuando el usuario tiene muchos archivos guardados.
    const dataFound = await DataModel.find(query)
      .sort({ updatedAt: -1 })
      .lean();
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
    const deleted = await DataModel.findOneAndDelete(query).lean();
    if (!deleted) return res.status(404).json({ message: "Not found" });
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete data" });
  }
};
