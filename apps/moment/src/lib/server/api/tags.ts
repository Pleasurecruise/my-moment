import { Hono } from "hono";
import type { WorkerEnv } from "../access";
import { verifyApiKey } from "../apikey";
import { getAllTags } from "../photos/repository";

export const tagApi = new Hono<WorkerEnv>();

tagApi.get("/", async (c) => {
  if (!(await verifyApiKey(c.req.raw, c.env.API_KEY))) {
    c.header("WWW-Authenticate", "Bearer");
    return c.json({ error: "Unauthorized." }, 401);
  }

  return c.json({ tags: await getAllTags(c.env.DB) });
});
