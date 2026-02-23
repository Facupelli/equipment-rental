import { z } from "zod";

export const CreateBlackoutPeriodSchema = z.object({
  inventoryItemId: z.uuid(),
  reason: z.string().min(1, "Reason cannot be empty"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type CreateBlackoutPeriodDto = z.infer<
  typeof CreateBlackoutPeriodSchema
>;
