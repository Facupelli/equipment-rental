import type { ProblemDetailsError } from "@/shared/errors";
import type {
  CustomerResponseDto,
  GetCustomersQueryDto,
  PaginatedDto,
} from "@repo/schemas";
import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getCustomers } from "./customer.api";

type PaginatedCustomers = PaginatedDto<CustomerResponseDto>;

type CustomersQueryOptions<TData = PaginatedCustomers> = Omit<
  UseQueryOptions<PaginatedCustomers, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

export function createCustomersQueryOptions<TData = PaginatedCustomers>(
  params: GetCustomersQueryDto,
  options?: CustomersQueryOptions<TData>,
): UseQueryOptions<PaginatedCustomers, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["customers", params],
    queryFn: () => getCustomers({ data: params }),
  };
}

export function useCustomers<TData = PaginatedCustomers>(
  params: GetCustomersQueryDto,
  options?: CustomersQueryOptions<TData>,
) {
  return useQuery({
    ...createCustomersQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}
