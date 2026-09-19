import { z } from "zod";

export const mediaKindSchema = z.enum(["anime", "film"]);
export type MediaKind = z.infer<typeof mediaKindSchema>;

export const mediaItemSchema = z.object({
  id: z.string(),
  kind: mediaKindSchema,
  title: z.string(),
  description: z.string(),
  date: z.string().optional(),
  imageUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;

export const mediaFormSchema = z.object({
  kind: mediaKindSchema,
  title: z.string().trim().min(1, "title is required"),
  description: z.string().trim(),
  date: z.string(),
  imageUrl: z.string().optional(),
});

export type MediaFormInput = z.input<typeof mediaFormSchema>;
export type MediaFormData = z.output<typeof mediaFormSchema>;
