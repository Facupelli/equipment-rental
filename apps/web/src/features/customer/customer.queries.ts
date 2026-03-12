import type { ProblemDetailsError } from "@/shared/errors";
import type {
  CustomerDetailResponseDto,
  CustomerProfileResponseDto,
  CustomerResponseDto,
  GetCustomersQueryDto,
  PaginatedDto,
} from "@repo/schemas";
import {
  keepPreviousData,
  useQuery,
  useSuspenseQuery,
  type UseQueryOptions,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import {
  getCustomerDetail,
  getCustomerProfile,
  getCustomers,
} from "./customer.api";

type PaginatedCustomers = PaginatedDto<CustomerResponseDto>;

type CustomersQueryOptions<TData = PaginatedCustomers> = Omit<
  UseQueryOptions<PaginatedCustomers, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

type CustomerDetailQueryOptions<TData = CustomerDetailResponseDto> = Omit<
  UseSuspenseQueryOptions<
    CustomerDetailResponseDto,
    ProblemDetailsError,
    TData
  >,
  "queryKey" | "queryFn"
>;

type CustomerProfileQueryOptions<TData = CustomerProfileResponseDto> = Omit<
  UseQueryOptions<CustomerProfileResponseDto, ProblemDetailsError, TData>,
  "queryKey" | "queryFn"
>;

// -----------------------------------------------------

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

export function createCustomerDetailQueryOptions<
  TData = CustomerDetailResponseDto,
>(
  customerId: string,
  options?: CustomerDetailQueryOptions<TData>,
): UseSuspenseQueryOptions<
  CustomerDetailResponseDto,
  ProblemDetailsError,
  TData
> {
  return {
    ...options,
    queryKey: ["customers", customerId],
    queryFn: () => getCustomerDetail({ data: { customerId } }),
  };
}

export function createCustomerProfileQueryOptions<
  TData = CustomerProfileResponseDto,
>(
  customerId: string,
  options?: CustomerProfileQueryOptions<TData>,
): UseQueryOptions<CustomerProfileResponseDto, ProblemDetailsError, TData> {
  return {
    ...options,
    queryKey: ["customers", customerId, "profile"],
    queryFn: () => getCustomerProfile({ data: { customerId } }),
  };
}

// -----------------------------------------------------

export function useCustomers<TData = PaginatedCustomers>(
  params: GetCustomersQueryDto,
  options?: CustomersQueryOptions<TData>,
) {
  return useQuery({
    ...createCustomersQueryOptions(params, options),
    placeholderData: keepPreviousData,
  });
}

export function useCustomerDetail<TData = CustomerDetailResponseDto>(
  customerId: string,
  options?: CustomerDetailQueryOptions<TData>,
) {
  return useSuspenseQuery(
    createCustomerDetailQueryOptions(customerId, options),
  );
}

export function useCustomerProfile<TData = CustomerProfileResponseDto>(
  customerId: string,
  options?: CustomerProfileQueryOptions<TData>,
) {
  return useQuery(createCustomerProfileQueryOptions(customerId, options));
}
