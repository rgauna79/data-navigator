import { z } from "zod";

const sheetName = z
  .string({ error: "Sheet name is required" })
  .trim()
  .min(1, { message: "Sheet name is required" })
  .max(200, { message: "Sheet name is too long" });

export const saveDataSchema = z.object({
  sheetName,
  // Matriz de la hoja: la primera fila son los encabezados
  fileData: z.array(z.array(z.any()), { error: "fileData must be a 2D array" }),
  // Confirma que se puede reemplazar un archivo guardado con el mismo nombre
  overwrite: z.boolean().optional(),
});

export const renameDataSchema = z.object({ sheetName });
