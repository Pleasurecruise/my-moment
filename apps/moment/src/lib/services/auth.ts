import { createAuthClient } from "better-auth/solid";

export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;
