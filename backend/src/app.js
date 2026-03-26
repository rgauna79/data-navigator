import express from "express";
import cors from "cors";
import morgan from "morgan";
import AuthRoutes from "./routes/auth.routes.js";
import UserRoutes from "./routes/user.routes.js";
import DataRoutes from "./routes/data.routes.js";
import ReportRoutes from "./routes/report.routes.js"; // ✅ nuevo
import cookieParser from "cookie-parser";
import path from "path";

const app = express();
const frontendUrl = (
  process.env.FRONTEND_URL || "http://localhost:5173"
).replace(/\/$/, "");

console.log("FRONTEND_URL: ", frontendUrl);

app.set("trust proxy", 1);

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use("/api/auth", AuthRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/data", DataRoutes);
app.use("/api/reports", ReportRoutes); // ✅ nuevo

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve("client-frontend", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("client-frontend", "dist", "index.html"));
  });
}

app.get("/", (req, res) => res.send("API is running!"));

export default app;
