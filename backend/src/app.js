import express from "express";
import cors from "cors";
//import { FRONTEND_URL } from "./config.js";
import morgan from "morgan";
import AuthRoutes from "./routes/auth.routes.js";
import UserRoutes from "./routes/user.routes.js";
import DataRoutes from "./routes/data.routes.js";
import cookieParser from "cookie-parser";
import path from "path";

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

console.log(frontendUrl);

app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

// Authentication routes
app.use("/api/auth", AuthRoutes);

// User management routes
app.use("/api/users", UserRoutes);

// Data management routes
app.use("/api/data", DataRoutes);


if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve("client-frontend", "dist")));

  app.get("*", (req, res) => {
    console.log(path.resolve("client-frontend", "dist", "index.html"));
    res.sendFile(path.resolve("client-frontend", "dist", "index.html"));
  });
}

app.get("/", (req, res) => {
  res.send("API is running!");
});

export default app;
