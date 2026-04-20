import type { CreatePromotionDto } from "@repo/schemas";
import type { MutationOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import {
	createPromotion,
	deletePromotion,
	updatePromotion,
} from "./promotions.api";
import { promotionKeys } from "./promotions.queries";

type CreatePromotionOptions = Omit<
	MutationOptions<string, ProblemDetailsError, CreatePromotionDto>,
	"mutationFn" | "mutationKey"
>;

type UpdatePromotionOptions = Omit<
	MutationOptions<
		void,
		ProblemDetailsError,
		{ promotionId: string; dto: CreatePromotionDto }
	>,
	"mutationFn" | "mutationKey"
>;

type DeletePromotionOptions = Omit<
	MutationOptions<void, ProblemDetailsError, { promotionId: string }>,
	"mutationFn" | "mutationKey"
>;

export function useCreatePromotion(options?: CreatePromotionOptions) {
	return useMutation<string, ProblemDetailsError, CreatePromotionDto>({
		...options,
		mutationFn: async (data) => {
			const result = await createPromotion({ data });
			if (typeof result === "object" && result !== null && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}

			return result;
		},
		meta: {
			invalidates: promotionKeys.lists(),
		},
	});
}

export function useUpdatePromotion(options?: UpdatePromotionOptions) {
	return useMutation<
		void,
		ProblemDetailsError,
		{ promotionId: string; dto: CreatePromotionDto }
	>({
		...options,
		mutationFn: async (data) => {
			const result = await updatePromotion({ data });
			if (typeof result === "object" && result !== null && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}
		},
		meta: {
			invalidates: promotionKeys.lists(),
		},
	});
}

export function useDeletePromotion(options?: DeletePromotionOptions) {
	return useMutation<void, ProblemDetailsError, { promotionId: string }>({
		...options,
		mutationFn: async (data) => {
			const result = await deletePromotion({ data });
			if (typeof result === "object" && result !== null && "error" in result) {
				throw new ProblemDetailsError(result.error);
			}
		},
		meta: {
			invalidates: promotionKeys.lists(),
		},
	});
}
