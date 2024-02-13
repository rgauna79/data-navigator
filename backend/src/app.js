import express from "express";
import cors from "cors";
//import { FRONTEND_URL } from "./config.js";
import morgan from "morgan";
import AuthRoutes from "./routes/auth.routes.js";
import UserRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser";

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "https://93wx6l-5173.csb.app";

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

app.get("/", (req, res) => {
  res.send("API is running!");
});

export default app;
