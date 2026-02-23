import { z } from "zod";
import { TrackingType } from "@repo/types";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long" })
    .max(255, { message: "Name cannot exceed 255 characters" }),
  trackingType: z.enum(TrackingType),
  baseRentalPrice: z
    .number()
    .positive({ message: "Base rental price must be a positive number" }),

  // JSONB field: flexible object structure
  attributes: z.record(z.string(), z.string()).optional().default({}),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
