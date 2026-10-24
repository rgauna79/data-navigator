import dotenv from "dotenv";

// quiet: dotenv >= 17 imprime un aviso en cada arranque
dotenv.config({ quiet: true });

export const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error(
    "TOKEN_SECRET is not defined. Set the TOKEN_SECRET environment variable in backend/.env (see backend/.sampleenv)."
  );
}
