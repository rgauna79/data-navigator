import { TOKEN_SECRET } from "../config.js";
import jwt from "jsonwebtoken";

export function createAccessToken(user) {
  return new Promise((resolve, reject) => {
    jwt.sign(user, TOKEN_SECRET, { expiresIn: "1d" }, (err, token) => {
      if (err) {
        console.error("Error creating access token:", err);
        return reject(err);
      }
      resolve(token);
    });
  });
}
