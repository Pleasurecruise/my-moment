/// <reference types="@cloudflare/workers-types" />

import { betterAuth } from "better-auth";
import type { Session, User } from "better-auth";

export interface AuthEnv {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ALLOWED_EMAIL?: string;
}

export interface AuthSession {
  user: User;
  session: Session;
}

export function createAuth(env: AuthEnv) {
  return betterAuth({
    database: env.DB,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.BETTER_AUTH_URL],
    advanced: {
      useSecureCookies: env.BETTER_AUTH_URL.startsWith("https"),
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (env.ALLOWED_EMAIL && user.email !== env.ALLOWED_EMAIL) {
              return false;
            }
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
  });
}

export const getAuth = createAuth;

export type Auth = ReturnType<typeof createAuth>;

export async function getSessionFromRequest(
  auth: Auth,
  headers: Headers,
): Promise<AuthSession | null> {
  const result = await auth.api.getSession({ headers });
  if (!result) return null;

  return {
    user: result.user,
    session: result.session,
  };
}
