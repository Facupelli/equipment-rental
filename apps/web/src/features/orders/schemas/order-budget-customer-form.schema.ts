import type { GenerateOrderBudgetRequestDto } from "@repo/schemas";
import { z } from "zod";

export const orderBudgetCustomerFormSchema = z.object({
	fullName: z.string(),
	documentNumber: z.string(),
	address: z.string(),
	phone: z.string(),
});

export type OrderBudgetCustomerFormValues = z.infer<
	typeof orderBudgetCustomerFormSchema
>;

export const orderBudgetCustomerFormDefaults: OrderBudgetCustomerFormValues = {
	fullName: "",
	documentNumber: "",
	address: "",
	phone: "",
};

export function toOrderBudgetRequestDto(
	values: OrderBudgetCustomerFormValues,
): GenerateOrderBudgetRequestDto {
	const customer = {
		fullName: toOptionalTrimmedString(values.fullName),
		documentNumber: toOptionalTrimmedString(values.documentNumber),
		address: toOptionalTrimmedString(values.address),
		phone: toOptionalTrimmedString(values.phone),
	};

	if (Object.values(customer).every((value) => value === undefined)) {
		return {};
	}

	return { customer };
}

function toOptionalTrimmedString(value: string): string | undefined {
	const trimmedValue = value.trim();
	return trimmedValue ? trimmedValue : undefined;
}
