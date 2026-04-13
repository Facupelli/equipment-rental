import type { CreatePromotionDto } from "@repo/schemas";
import type { MutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import { createPromotion } from "./promotions.api";
import { promotionKeys } from "./promotions.queries";

type CreatePromotionOptions = Omit<
	MutationOptions<string, ProblemDetailsError, CreatePromotionDto>,
	"mutationFn" | "mutationKey"
>;

export function useCreatePromotion(options?: CreatePromotionOptions) {
	return useMutation<string, ProblemDetailsError, CreatePromotionDto>({
		...options,
		mutationFn: (data) => createPromotion({ data }),
		meta: {
			invalidates: promotionKeys.lists(),
		},
	});
}
