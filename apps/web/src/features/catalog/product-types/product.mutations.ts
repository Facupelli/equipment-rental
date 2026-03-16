import { useMutation } from "@tanstack/react-query";
import {
  createProduct,
  publishProductType,
  retireProductType,
} from "./products.api";
import type { CreateProductTypeDto } from "@repo/schemas";
import type { ProblemDetailsError } from "@/shared/errors";
import type { MutationOptions } from "@tanstack/react-query";
import { productKeys } from "./products.queries";

type CreateProductOptions = Omit<
  MutationOptions<string, ProblemDetailsError, CreateProductTypeDto>,
  "mutationFn" | "mutationKey"
>;

type ProductLifecycleOptions = Omit<
  MutationOptions<void, ProblemDetailsError, { productTypeId: string }>,
  "mutationFn" | "mutationKey"
>;

// -------------------------------------------------------
// Mutations
// Invalidation is handled globally via MutationCache + meta.
// See: query-client.ts for the global onSettled handler.
// -------------------------------------------------------

export function useCreateProduct(options?: CreateProductOptions) {
  return useMutation<string, ProblemDetailsError, CreateProductTypeDto>({
    ...options,
    mutationFn: (data) => createProduct({ data }),
    meta: {
      // Invalidates all product lists on success
      invalidates: productKeys.lists(),
    },
  });
}

export function usePublishProductType(options?: ProductLifecycleOptions) {
  return useMutation<void, ProblemDetailsError, { productTypeId: string }>({
    ...options,
    mutationFn: (data) => publishProductType({ data }),
    meta: {
      // Invalidates all product details on success (surgical: lists stay intact)
      invalidates: productKeys.details(),
    },
  });
}

export function useRetireProductType(options?: ProductLifecycleOptions) {
  return useMutation<void, ProblemDetailsError, { productTypeId: string }>({
    ...options,
    mutationFn: (data) => retireProductType({ data }),
    meta: {
      invalidates: productKeys.details(),
    },
  });
}
