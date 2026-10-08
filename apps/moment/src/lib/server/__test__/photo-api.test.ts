import { createHash } from "node:crypto";
import { describe, expect, it } from "vite-plus/test";
import type { WorkerBindings } from "~/types";
import { photoApi } from "../api/photos";

function authenticatedEnv(apiKey: string): WorkerBindings {
  const digest = createHash("sha256").update(apiKey).digest("hex");
  return {
    DB: {} as D1Database,
    MOMENT_BUCKET: {} as R2Bucket,
    MOMENT_CACHE: {} as KVNamespace,
    API_KEY: {
      getByName: () => ({
        fetch: async () =>
          Response.json({ version: 1, digest, createdAt: "2026-08-23T00:00:00.000Z" }),
      }),
    },
    ALLOWED_EMAIL: "owner@example.com",
    ASSETS: {} as Fetcher,
  };
}

describe("photo REST API errors", () => {
  it("returns JSON 400 for an invalid photo payload", async () => {
    const apiKey = "sk-moment-test";
    const response = await photoApi.request(
      "/",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: "{}",
      },
      authenticatedEnv(apiKey),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid photo payload." });
  });

  it.each(["POST /", "PATCH /photo-1"])(
    "returns JSON 400 for malformed JSON on %s",
    async (route) => {
      const apiKey = "sk-moment-test";
      const [method, path] = route.split(" ");
      const response = await photoApi.request(
        path!,
        {
          method,
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: "{not json",
        },
        authenticatedEnv(apiKey),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: "Invalid photo payload." });
    },
  );
});
