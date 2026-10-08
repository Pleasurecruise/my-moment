import { createSignal, onSettled } from "solid-js";
import { auth } from "void/client";

export const authClient = auth;

export const { signIn, signOut } = authClient;

export function useSession() {
  const [session, setSession] = createSignal(authClient.useSession.get());
  onSettled(() => authClient.useSession.subscribe((value) => setSession(() => value)));
  return session;
}
