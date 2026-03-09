import type { ProblemDetailsError } from "@/shared/errors";
import type { SetPricingTiersDto } from "@repo/schemas";
import {
  useMutation,
  useQueryClient,
  type MutationOptions,
} from "@tanstack/react-query";
import { setPricingTiers } from "./pricing-tier.api";

type PricingTierMutationOptions = Omit<
  MutationOptions<string, ProblemDetailsError, SetPricingTiersDto>,
  "mutationFn" | "mutationKey"
>;

export function useSetPricingTiers(options?: PricingTierMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation<string, ProblemDetailsError, SetPricingTiersDto>({
    ...options,
    mutationFn: (data) => setPricingTiers({ data }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      // await queryClient.invalidateQueries({
      //   queryKey: createBundlesQueryOptions().queryKey,
      // });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: async (error, variables, onMutateResult, context) => {
      await options?.onError?.(error, variables, onMutateResult, context);
    },
  });
}
