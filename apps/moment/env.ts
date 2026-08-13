import { defineEnv, email, string } from "void/env";

export default defineEnv({
  BETTER_AUTH_SECRET: string().secret(),
  GOOGLE_CLIENT_ID: string().secret(),
  GOOGLE_CLIENT_SECRET: string().secret(),
  ALLOWED_EMAIL: email().optional(),
});
