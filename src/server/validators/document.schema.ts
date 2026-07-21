import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim()
    .optional()
    .default("Untitled Document"),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be at most 255 characters")
    .trim()
    .optional(),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const addCollaboratorSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  role: z.enum(["EDITOR", "VIEWER"], {
    message: "Role must be EDITOR or VIEWER",
  }),
});

export const updateCollaboratorSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"], {
    message: "Role must be EDITOR or VIEWER",
  }),
});

export const createVersionSchema = z.object({
  title: z
    .string()
    .min(1, "Version title is required")
    .max(255, "Version title must be at most 255 characters")
    .trim(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
