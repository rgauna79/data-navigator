import express from "express";
import cors from "cors";
//import { FRONTEND_URL } from "./config.js";
import morgan from "morgan";
import AuthRoutes from "./routes/auth.routes.js";
const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/auth", AuthRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
