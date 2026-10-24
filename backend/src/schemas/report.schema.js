import { z } from "zod";

export const saveReportSchema = z.object({
  name: z
    .string({ error: "Report name is required" })
    .trim()
    .min(1, { message: "Report name is required" })
    .max(200, { message: "Report name is too long" }),
  type: z.enum(["statistics", "mostRepeated", "group"], { error: "Invalid report type" }),
  sheetName: z.string().max(200).optional().default(""),
  selectedOptions: z.record(z.string(), z.any()).optional().default({}),
  snapshot: z.object(
    {
      headers: z.array(z.any()),
      data: z.array(z.array(z.any())),
      config: z.any().optional(),
      columnTypes: z.any().optional(),
    },
    { error: "Report data is required" }
  ),
});
