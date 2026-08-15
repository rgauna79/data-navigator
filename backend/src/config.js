import "dotenv/config";

export const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error(
    "TOKEN_SECRET is not defined. Set the TOKEN_SECRET environment variable in backend/.env (see backend/.sampleenv)."
  );
}
