import { customSession } from "better-auth/plugins";
import { defineAuth } from "void/auth";
import type { ValidatedEnv } from "void/env";
import { HOST_DISPLAY_NAME } from "./src/lib/identity.ts";

type AuthEnv = Pick<ValidatedEnv, "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "ALLOWED_EMAIL">;

export default defineAuth(({ defaults, env: authEnv, request }) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ALLOWED_EMAIL } = authEnv as AuthEnv;

  return {
    ...defaults,
    trustedOrigins: [new URL(request.url).origin],
    advanced: {
      ...defaults.advanced,
      useSecureCookies: new URL(request.url).protocol === "https:",
    },
    emailAndPassword: {
      ...defaults.emailAndPassword,
      enabled: false,
    },
    socialProviders: {
      google: {
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      ...defaults.session,
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [
      ...(defaults.plugins ?? []),
      customSession(async ({ user, session }) => ({
        user:
          ALLOWED_EMAIL && user.email === ALLOWED_EMAIL
            ? { ...user, name: HOST_DISPLAY_NAME }
            : user,
        session,
      })),
    ],
  };
});
