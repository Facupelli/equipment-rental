import {
	type RegisterCustomDomainDto,
	registerCustomDomainSchema,
} from "@repo/schemas";
import { z } from "zod";

export const customDomainFormSchema = z.object({
	domain: z
		.string()
		.trim()
		.min(1, "Domain is required")
		.refine((value) => !/\s/.test(value), "Domain cannot contain spaces"),
});

export type CustomDomainFormValues = z.infer<typeof customDomainFormSchema>;

export const customDomainFormDefaults: CustomDomainFormValues = {
	domain: "",
};

export function toRegisterCustomDomainDto(
	values: CustomDomainFormValues,
): RegisterCustomDomainDto {
	const dto = {
		domain: values.domain.trim().toLowerCase(),
	};

	return registerCustomDomainSchema.parse(dto);
}
