import { createSignal, onSettled } from "solid-js";
import { z } from "zod";
import { auth } from "void/client";

export const authClient = auth;

export const { signIn, signOut } = authClient;

const ownerSchema = z.object({ owner: z.boolean() });

export function useSession() {
  const [session, setSession] = createSignal(authClient.useSession.get());
  onSettled(() => authClient.useSession.subscribe((value) => setSession(() => value)));
  return session;
}

export async function apiGetOwner() {
  const response = await fetch("/api/owner");
  if (!response.ok) throw new Error("Could not load owner status.");
  return ownerSchema.parse(await response.json()).owner;
}

export function useOwner() {
  const [owner, setOwner] = createSignal(false);
  onSettled(() => {
    apiGetOwner()
      .then(setOwner)
      .catch(() => setOwner(false));
  });
  return owner;
}
