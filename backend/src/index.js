import app from "./app.js";
import { connectDB } from "./db.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;

async function main() {
  try {
    connectDB();
    app.listen(PORT);
    console.log("Server listening on port", PORT);
  } catch (error) {
    console.log(error);
  }
}

main();
