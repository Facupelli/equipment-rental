import type { CreateLongRentalDiscountDto } from "@repo/schemas";
import type { MutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import { createLongRentalDiscount } from "./long-rental-discounts.api";
import { longRentalDiscountKeys } from "./long-rental-discounts.queries";

type CreateLongRentalDiscountOptions = Omit<
	MutationOptions<string, ProblemDetailsError, CreateLongRentalDiscountDto>,
	"mutationFn" | "mutationKey"
>;

export function useCreateLongRentalDiscount(
	options?: CreateLongRentalDiscountOptions,
) {
	return useMutation<string, ProblemDetailsError, CreateLongRentalDiscountDto>({
		...options,
		mutationFn: (data) => createLongRentalDiscount({ data }),
		meta: {
			invalidates: longRentalDiscountKeys.lists(),
		},
	});
}
