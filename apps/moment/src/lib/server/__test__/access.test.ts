import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkerBindings } from "~/types";

const getSession = vi.hoisted(() => vi.fn());

vi.mock("void/auth", () => ({ getSession }));

import { createOwnerGuard, type WorkerEnv } from "../access";

const ownerEmail = "owner@example.com";
const env = { ALLOWED_EMAIL: ownerEmail } as WorkerBindings;

function createApp(notConfiguredMessage?: string) {
  const app = new Hono<WorkerEnv>();
  app.get("/private", createOwnerGuard(notConfiguredMessage), (c) =>
    c.json({ ownerId: c.get("ownerId") }),
  );
  return app;
}

describe("createOwnerGuard", () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it("returns 500 when owner access is not configured", async () => {
    const response = await createApp("Upload not configured").request(
      "/private",
      undefined,
      {} as WorkerBindings,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Upload not configured" });
    expect(getSession).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no signed-in user", async () => {
    getSession.mockReturnValue(null);

    const response = await createApp().request("/private", undefined, env);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 when the signed-in user is not the owner", async () => {
    getSession.mockReturnValue({ user: { id: "guest-id", email: "guest@example.com" } });

    const response = await createApp().request("/private", undefined, env);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("passes the owner id to protected handlers", async () => {
    getSession.mockReturnValue({ user: { id: "owner-id", email: ownerEmail } });

    const response = await createApp().request("/private", undefined, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ownerId: "owner-id" });
  });
});
