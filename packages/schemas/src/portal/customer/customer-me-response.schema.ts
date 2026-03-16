import { OnboardingStatus } from "@repo/types";
import { z } from "zod";

export const meCustomerResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string(),
  isActive: z.boolean(),
  isCompany: z.boolean(),
  companyName: z.string().nullable(),
  tenantId: z.string(),
  onboardingStatus: z.enum(OnboardingStatus),
});

export type MeCustomerResponseDto = z.infer<typeof meCustomerResponseSchema>;
