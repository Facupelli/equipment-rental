import { z } from 'zod';

const optionalTrimmedString = z.string().trim().optional();

export const generateOrderBudgetCustomerSchema = z.object({
  fullName: optionalTrimmedString,
  documentNumber: optionalTrimmedString,
  address: optionalTrimmedString,
  phone: optionalTrimmedString,
});

export const generateOrderBudgetRequestSchema = z.object({
  customer: generateOrderBudgetCustomerSchema.optional(),
});

export type GenerateOrderBudgetCustomerDto = z.infer<typeof generateOrderBudgetCustomerSchema>;
export type GenerateOrderBudgetRequestDto = z.infer<typeof generateOrderBudgetRequestSchema>;
