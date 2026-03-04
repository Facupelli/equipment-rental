import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ProblemDetailsError } from "@/shared/errors";
import type { BillingUnitListResponse } from "@repo/schemas";
import { getBillingUnits } from "./billing-unit.api";

type BillingUnitQueryOptions<TData = BillingUnitListResponse> = Omit<
  UseQueryOptions<BillingUnitListResponse, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

export function createBillingUnitQueryOptions<TData = BillingUnitListResponse>(
  options?: BillingUnitQueryOptions<TData>,
): UseQueryOptions<BillingUnitListResponse, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["billing-units"],
    queryFn: () => getBillingUnits(),
  };
}

// -----------------------------------------------------

export function useBillingUnits<TData = BillingUnitListResponse>(
  options?: BillingUnitQueryOptions<TData>,
) {
  return useQuery(createBillingUnitQueryOptions(options));
}
