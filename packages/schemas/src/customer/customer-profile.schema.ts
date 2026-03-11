import { z } from "zod";

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
  occupation: z.string().min(1),
  company: z.string().nullable(),
  taxId: z.string().nullable(),
  businessName: z.string().nullable(),
  bankName: z.string().min(1),
  accountNumber: z.string().min(1),
  contact1Name: z.string().min(1),
  contact1Relationship: z.string().min(1),
  contact2Name: z.string().min(1),
  contact2Relationship: z.string().min(1),
});

export type CustomerProfile = z.infer<typeof customerProfileSchema>;
