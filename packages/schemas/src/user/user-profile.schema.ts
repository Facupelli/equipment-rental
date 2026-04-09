import { z } from "zod";

export const createUserProfileSchema = z.object({
	fullName: z.string().trim().min(1),
	documentNumber: z.string().trim().min(1),
	phone: z.string().trim().min(1),
	address: z.string().trim().min(1),
	signUrl: z.string().trim().url(),
});

export const updateUserProfileSchema = z.object({
	fullName: z.string().trim().min(1).optional(),
	documentNumber: z.string().trim().min(1).optional(),
	phone: z.string().trim().min(1).optional(),
	address: z.string().trim().min(1).optional(),
	signUrl: z.string().trim().url().optional(),
});

export const userProfileResponseSchema = z.object({
	id: z.uuid(),
	userId: z.uuid(),
	fullName: z.string(),
	documentNumber: z.string(),
	phone: z.string(),
	address: z.string(),
	signUrl: z.string().url(),
});

export type CreateUserProfileDto = z.infer<typeof createUserProfileSchema>;
export type UpdateUserProfileDto = z.infer<typeof updateUserProfileSchema>;
export type UserProfileResponseDto = z.infer<typeof userProfileResponseSchema>;
