import { z } from "zod";

export const saveDataSchema = z.object({
  sheetName: z
    .string({ error: "Sheet name is required" })
    .trim()
    .min(1, { message: "Sheet name is required" })
    .max(200, { message: "Sheet name is too long" }),
  // Matriz de la hoja: la primera fila son los encabezados
  fileData: z.array(z.array(z.any()), { error: "fileData must be a 2D array" }),
});
