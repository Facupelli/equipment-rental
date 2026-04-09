import { z } from "zod";

const customerProfileStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

export const approveCustomerProfileSchema = z.object({});

export const rejectCustomerProfileSchema = z.object({
  reason: z.string().min(1),
});

export type ApproveCustomerProfileDto = z.infer<
  typeof approveCustomerProfileSchema
>;
export type RejectCustomerProfileDto = z.infer<
  typeof rejectCustomerProfileSchema
>;

export const customerProfileSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  birthDate: z.iso.date(),
  documentNumber: z.string().min(1),
  identityDocumentPath: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  stateRegion: z.string().min(1),
  country: z.string().min(1),
  occupation: z.string(),
  company: z.string().nullable(),
  taxId: z.string().nullable(),
  businessName: z.string().nullable(),
  bankName: z.string(),
  accountNumber: z.string(),
  contact1Name: z.string().min(1),
  contact1Relationship: z.string().min(1),
  contact2Name: z.string(),
  contact2Relationship: z.string(),
});

export type CustomerProfile = z.infer<typeof customerProfileSchema>;

export const pendingCustomerProfileListItemSchema = z.object({
  id: z.uuid(),
  customerName: z.string(),
  submittedAt: z.coerce.date(),
  status: customerProfileStatusSchema,
});

export const getPendingCustomerProfilesResponseSchema = z.array(
  pendingCustomerProfileListItemSchema,
);

export type PendingCustomerProfileListItem = z.infer<
  typeof pendingCustomerProfileListItemSchema
>;

export type GetPendingCustomerProfilesResponseDto = z.infer<
  typeof getPendingCustomerProfilesResponseSchema
>;

export const pendingCustomerProfileReviewCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type PendingCustomerProfileReviewCountResponseDto = z.infer<
  typeof pendingCustomerProfileReviewCountResponseSchema
>;

export const CustomerProfileResponseSchema = z.object({
  id: z.uuid(),
  customerId: z.uuid(),
  status: customerProfileStatusSchema,
  submittedAt: z.coerce.date(),

  // Personal
  fullName: z.string(),
  phone: z.string(),
  birthDate: z.coerce.date(),
  documentNumber: z.string(),
  identityDocumentPath: z.string(),

  // Address
  address: z.string(),
  city: z.string(),
  stateRegion: z.string(),
  country: z.string(),

  // Professional
  occupation: z.string(),
  company: z.string().nullable(),
  taxId: z.string().nullable(),
  businessName: z.string().nullable(),

  // Bank
  bankName: z.string(),
  accountNumber: z.string(),

  // Reference contacts
  contact1Name: z.string(),
  contact1Relationship: z.string(),
  contact2Name: z.string(),
  contact2Relationship: z.string(),

  // Review
  rejectionReason: z.string().nullable(),
  reviewedAt: z.date().nullable(),
  reviewedById: z.uuid().nullable(),
});

export type CustomerProfileResponseDto = z.infer<
  typeof CustomerProfileResponseSchema
>;
