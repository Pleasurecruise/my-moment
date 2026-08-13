import type { Context, MiddlewareHandler } from "hono";
import { getSession } from "void/auth";
import type { WorkerBindings } from "~/types";

export interface WorkerVariables {
  ownerId: string;
}

export type WorkerEnv = {
  Bindings: WorkerBindings;
  Variables: WorkerVariables;
};

export async function requestIsOwner(c: Context<WorkerEnv>): Promise<boolean> {
  if (!c.env.ALLOWED_EMAIL) return false;
  const session = getSession();
  return session?.user?.email === c.env.ALLOWED_EMAIL;
}

export function createOwnerGuard(
  notConfiguredMessage = "Not configured",
): MiddlewareHandler<WorkerEnv> {
  return async (c, next) => {
    const allowedEmail = c.env.ALLOWED_EMAIL;
    if (!allowedEmail) return c.json({ error: notConfiguredMessage }, 500);

    const session = getSession();
    if (!session?.user?.email) return c.json({ error: "Unauthorized" }, 401);
    if (session.user.email !== allowedEmail) return c.json({ error: "Forbidden" }, 403);

    c.set("ownerId", session.user.id);
    await next();
  };
}
