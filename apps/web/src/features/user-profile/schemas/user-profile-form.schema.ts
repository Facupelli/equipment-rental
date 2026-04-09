import {
	type CreateUserProfileDto,
	createUserProfileSchema,
	type UpdateUserProfileDto,
	type UserProfileResponseDto,
	updateUserProfileSchema,
} from "@repo/schemas";
import { z } from "zod";

const signatureFileSchema = z.custom<File | null>(
	(value) =>
		value === null ||
		value === undefined ||
		(typeof File !== "undefined" && value instanceof File),
);

export const userProfileFormSchema = z
	.object({
		fullName: z.string().trim().min(1, "El nombre completo es obligatorio."),
		documentNumber: z
			.string()
			.trim()
			.min(1, "El numero de documento es obligatorio."),
		phone: z.string().trim().min(1, "El telefono es obligatorio."),
		address: z.string().trim().min(1, "La direccion es obligatoria."),
		signUrl: z.string().trim(),
		signatureFile: signatureFileSchema,
	})
	.superRefine((values, ctx) => {
		const signUrl = values.signUrl.trim();

		if (!signUrl && !values.signatureFile) {
			ctx.addIssue({
				code: "custom",
				message: "Subi la firma que se usara en los contratos.",
				path: ["signUrl"],
			});
			return;
		}

		if (signUrl && !z.url().safeParse(signUrl).success) {
			ctx.addIssue({
				code: "custom",
				message: "La URL de la firma no es valida.",
				path: ["signUrl"],
			});
		}
	});

export type UserProfileFormValues = z.infer<typeof userProfileFormSchema>;

type UserProfileDtoValues = Omit<UserProfileFormValues, "signatureFile">;

export type UserProfileDirtyValues = Partial<UserProfileDtoValues>;

export const userProfileFormDefaults: UserProfileFormValues = {
	fullName: "",
	documentNumber: "",
	phone: "",
	address: "",
	signUrl: "",
	signatureFile: null,
};

export function userProfileToFormValues(
	profile?: Partial<UserProfileResponseDto> | null,
): UserProfileFormValues {
	return {
		fullName: profile?.fullName ?? "",
		documentNumber: profile?.documentNumber ?? "",
		phone: profile?.phone ?? "",
		address: profile?.address ?? "",
		signUrl: profile?.signUrl ?? "",
		signatureFile: null,
	};
}

export function toCreateUserProfileDto(
	values: UserProfileDtoValues,
): CreateUserProfileDto {
	return createUserProfileSchema.parse({
		fullName: values.fullName.trim(),
		documentNumber: values.documentNumber.trim(),
		phone: values.phone.trim(),
		address: values.address.trim(),
		signUrl: values.signUrl.trim(),
	});
}

export function toUpdateUserProfileDto(
	dirtyValues: UserProfileDirtyValues,
): UpdateUserProfileDto {
	const dto: UpdateUserProfileDto = {};

	if (dirtyValues.fullName !== undefined) {
		dto.fullName = dirtyValues.fullName.trim();
	}

	if (dirtyValues.documentNumber !== undefined) {
		dto.documentNumber = dirtyValues.documentNumber.trim();
	}

	if (dirtyValues.phone !== undefined) {
		dto.phone = dirtyValues.phone.trim();
	}

	if (dirtyValues.address !== undefined) {
		dto.address = dirtyValues.address.trim();
	}

	if (dirtyValues.signUrl !== undefined) {
		dto.signUrl = dirtyValues.signUrl.trim();
	}

	return updateUserProfileSchema.parse(dto);
}
