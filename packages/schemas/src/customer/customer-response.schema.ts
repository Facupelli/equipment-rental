import { OnboardingStatus } from "@repo/types";
import z from "zod";

export const customerResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  isCompany: z.boolean(),
  companyName: z.string().nullable(),
  isActive: z.boolean(),
  onboardingStatus: z.enum(OnboardingStatus),
  createdAt: z.date(),
});

export type CustomerResponseDto = z.infer<typeof customerResponseSchema>;

export const getCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  onboardingStatus: z.enum(OnboardingStatus).nullish().default(null),
  isActive: z.coerce.boolean().nullish().default(null),
  isCompany: z.coerce.boolean().nullish().default(null),
  search: z.string().min(1).nullish().default(null),
});

export type GetCustomersQueryDto = z.infer<typeof getCustomersQuerySchema>;

// DETAIL

export const ActiveRentalSchema = z.object({
  orderId: z.uuid(),
  orderNumber: z.number(),
  returnDate: z.date(),
});

export const CustomerDetailResponseSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  isCompany: z.boolean(),
  companyName: z.string().nullable(),
  isActive: z.boolean(),
  onboardingStatus: z.string(),
  createdAt: z.date(),
  totalOrders: z.number(),
  activeRentals: z.array(ActiveRentalSchema),
});

export type CustomerDetailResponseDto = z.infer<
  typeof CustomerDetailResponseSchema
>;
