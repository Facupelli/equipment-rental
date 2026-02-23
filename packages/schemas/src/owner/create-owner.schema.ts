import { z } from "zod";

export const CreateOwnerSchema = z.object({
  name: z.string().min(1, "Owner name is required"),
});

export type CreateOwnerDto = z.infer<typeof CreateOwnerSchema>;
