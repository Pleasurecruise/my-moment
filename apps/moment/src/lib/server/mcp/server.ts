import {
  createMcpHandler,
  McpServer,
  type CallToolResult,
  type McpHttpHandler,
} from "@modelcontextprotocol/server";
import { z } from "zod";
import type { WorkerBindings } from "~/types";
import { photoUpdateSchema } from "~/types/photo";
import {
  createPhotoFromR2,
  deletePhoto,
  listPhotoMetadata,
  searchPhotoMetadata,
  updatePhoto,
} from "../photos/service";
import { getAllTags } from "../photos/repository";

const r2ObjectKeySchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (key) =>
      key.startsWith("img/") &&
      !/[\\%?#]/.test(key) &&
      !key.split("/").some((segment) => segment === "." || segment === ".."),
    "Expected a safe R2 object key below img/.",
  );

const createPhotoSchema = z.object({
  r2Key: r2ObjectKeySchema,
  thumbnailR2Key: r2ObjectKeySchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(10).default([]),
  date: z.string().trim().optional(),
  geo: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  thumbHash: z.string().optional(),
  width: z.number().int().min(0),
  height: z.number().int().min(0),
  aspectRatio: z.number().positive().optional(),
  format: z.string().trim().min(1).optional(),
});

export function createMomentMcpHandler(env: WorkerBindings): McpHttpHandler {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        { name: "my-moment", version: "1.0.0" },
        { capabilities: { tools: {} } },
      );

      server.registerTool(
        "get_tags",
        {
          description: "List all photo tags. Call this before filtering by a user-provided tag.",
          inputSchema: z.object({}),
          annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async (): Promise<CallToolResult> => {
          const value = { tags: await getAllTags(env.DB) };
          return {
            content: [{ type: "text", text: JSON.stringify(value) }],
            structuredContent: value,
          };
        },
      );

      server.registerTool(
        "list_photos",
        {
          description: "Browse photos by date range and tags without requiring keywords.",
          inputSchema: z.object({
            from_date: z.string().optional(),
            to_date: z.string().optional(),
            tags: z.array(z.string()).optional(),
            limit: z.number().int().min(1).max(100).default(20),
          }),
          annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ from_date, to_date, tags, limit }): Promise<CallToolResult> => {
          const value = {
            photos: await listPhotoMetadata(env.DB, {
              fromDate: from_date,
              toDate: to_date,
              tags,
              limit,
            }),
          };
          return {
            content: [{ type: "text", text: JSON.stringify(value) }],
            structuredContent: value,
          };
        },
      );

      server.registerTool(
        "search_photos",
        {
          description: "Search photo titles, descriptions, and tags by keyword.",
          inputSchema: z.object({
            query: z.string().trim().min(1),
            limit: z.number().int().min(1).max(100).default(20),
          }),
          annotations: { readOnlyHint: true, destructiveHint: false },
        },
        async ({ query, limit }): Promise<CallToolResult> => {
          const value = {
            type: "photo-search-results",
            query,
            photos: await searchPhotoMetadata(env.DB, { query, limit }),
          };
          return {
            content: [{ type: "text", text: JSON.stringify(value) }],
            structuredContent: value,
          };
        },
      );

      server.registerTool(
        "create_photo",
        {
          description:
            "Create photo metadata after the original and thumbnail objects have been uploaded to R2.",
          inputSchema: createPhotoSchema,
          annotations: { readOnlyHint: false, destructiveHint: false },
        },
        async (input): Promise<CallToolResult> => {
          const value = {
            photo: await createPhotoFromR2(env.DB, env.MOMENT_BUCKET, env.ALLOWED_EMAIL, input),
          };
          return {
            content: [{ type: "text", text: JSON.stringify(value) }],
            structuredContent: value,
          };
        },
      );

      server.registerTool(
        "update_photo",
        {
          description:
            "Update photo metadata. Obtain its ID with list_photos or search_photos first.",
          inputSchema: photoUpdateSchema.extend({ id: z.string().uuid() }),
          annotations: { readOnlyHint: false, destructiveHint: false },
        },
        async ({ id, ...input }): Promise<CallToolResult> => {
          if (Object.keys(input).length === 0) {
            const value = {
              error: { code: "NO_PHOTO_CHANGES", message: "No photo changes provided." },
            };
            return {
              isError: true,
              content: [{ type: "text", text: "No photo changes provided." }],
              structuredContent: value,
            };
          }
          const photo = await updatePhoto(env.DB, id, input);
          if (!photo) {
            const value = {
              error: { code: "PHOTO_NOT_FOUND", message: "Photo not found." },
            };
            return {
              isError: true,
              content: [{ type: "text", text: "Photo not found." }],
              structuredContent: value,
            };
          }
          const value = { photo };
          return {
            content: [{ type: "text", text: JSON.stringify(value) }],
            structuredContent: value,
          };
        },
      );

      server.registerTool(
        "delete_photo",
        {
          description: "Permanently delete a photo and its R2 objects. Confirm before calling.",
          inputSchema: z.object({ id: z.string().uuid() }),
          annotations: { readOnlyHint: false, destructiveHint: true },
        },
        async ({ id }): Promise<CallToolResult> => {
          const deleted = await deletePhoto(env.DB, env.MOMENT_BUCKET, id);
          if (!deleted) {
            const value = {
              error: { code: "PHOTO_NOT_FOUND", message: "Photo not found." },
            };
            return {
              isError: true,
              content: [{ type: "text", text: "Photo not found." }],
              structuredContent: value,
            };
          }
          const value = { id, deleted: true };
          return {
            content: [{ type: "text", text: JSON.stringify(value) }],
            structuredContent: value,
          };
        },
      );

      return server;
    },
    { legacy: "stateless", responseMode: "auto" },
  );
}
