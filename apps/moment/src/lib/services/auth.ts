import { auth } from "void/client/solid";

export const authClient = auth;

export const { signIn, signOut, useSession } = authClient;
