import express from "express";
import cors from "cors";
import morgan from "morgan";
import AuthRoutes from "./routes/auth.routes.js";
import UserRoutes from "./routes/user.routes.js";
import DataRoutes from "./routes/data.routes.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { csrfProtection } from "./middlewares/csrf.middleware.js";

const app = express();
// Límite del cuerpo JSON: las hojas guardadas se envían completas.
// MongoDB no admite documentos de más de 16 MB.
export const JSON_LIMIT = process.env.JSON_LIMIT || "15mb";

const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

console.log("FRONTEND_URL: ", frontendUrl);

app.set("trust proxy", 1);

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: JSON_LIMIT }));
app.use("/api", csrfProtection([frontendUrl]));

// Authentication routes
app.use("/api/auth", AuthRoutes);

// User management routes
app.use("/api/users", UserRoutes);

// Data management routes
app.use("/api/data", DataRoutes);

if (process.env.NODE_ENV === "production") {
  // Ruta relativa a este archivo, no al directorio desde donde se lanza node
  const distPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../client-frontend/dist",
  );
  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.get("/", (req, res) => {
  res.send("API is running!");
});

// Manejo de errores de express.json (cuerpo demasiado grande o JSON inválido)
app.use((err, req, res, next) => {
  if (err.type === "entity.too.large") {
    return res
      .status(413)
      .json({ message: `Data is too large to save (max ${JSON_LIMIT}).` });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
