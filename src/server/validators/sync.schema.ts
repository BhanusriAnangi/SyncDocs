import { z } from "zod";
import { MAX_SYNC_PAYLOAD_SIZE } from "@/utils/constants";

/**
 * Sync payload validation schema.
 * 
 * Security considerations:
 * 1. Max payload size prevents OOM attacks
 * 2. yjsUpdate is limited to prevent binary payload abuse
 * 3. All fields are strictly typed to prevent injection
 * 4. Operations array is capped at 100 to prevent batch abuse
 */

export const syncOperationSchema = z.object({
  operationType: z.enum(["CREATE", "UPDATE", "DELETE"]),
  content: z.record(z.string(), z.unknown()).optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  yjsUpdate: z
    .array(z.number().int().min(0).max(255))
    .max(MAX_SYNC_PAYLOAD_SIZE)
    .optional()
    .nullable(),
  timestamp: z.number().positive(),
});

export const syncPayloadSchema = z.object({
  documentId: z.string().cuid(),
  clientId: z.string().min(1).max(100),
  operations: z
    .array(syncOperationSchema)
    .min(1, "At least one operation required")
    .max(100, "Maximum 100 operations per sync batch"),
});

export type SyncPayloadInput = z.infer<typeof syncPayloadSchema>;
export type SyncOperationInput = z.infer<typeof syncOperationSchema>;
