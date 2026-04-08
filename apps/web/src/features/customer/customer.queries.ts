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
	queryOptions,
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

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const customerKeys = {
	all: () => ["customers"] as const,
	lists: () => [...customerKeys.all(), "list"] as const,
	list: (params: GetCustomersQueryDto) =>
		[...customerKeys.lists(), params] as const,
	details: () => [...customerKeys.all(), "detail"] as const,
	detail: (customerId: string) =>
		[...customerKeys.details(), customerId] as const,
	profile: (customerId: string) =>
		[...customerKeys.detail(customerId), "profile"] as const,
};

export const customerQueries = {
	detail: (customerId: string) =>
		queryOptions<CustomerDetailResponseDto, ProblemDetailsError>({
			queryKey: customerKeys.detail(customerId),
			queryFn: () => getCustomerDetail({ data: { customerId } }),
		}),
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

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
// Hooks
// -----------------------------------------------------

export function useCustomers<TData = PaginatedCustomers>(
	params: GetCustomersQueryDto,
	options?: CustomersQueryOptions<TData>,
) {
	return useQuery({
		...options,
		queryKey: customerKeys.list(params),
		queryFn: () => getCustomers({ data: params }),
		placeholderData: keepPreviousData,
	});
}

export function useCustomerDetail<TData = CustomerDetailResponseDto>(
	customerId: string,
	options?: CustomerDetailQueryOptions<TData>,
) {
	const { queryKey, queryFn } = customerQueries.detail(customerId);

	return useSuspenseQuery({
		...options,
		queryKey,
		queryFn,
	});
}

export function useCustomerProfile<TData = CustomerProfileResponseDto>(
	customerId: string,
	options?: CustomerProfileQueryOptions<TData>,
) {
	return useQuery({
		...options,
		queryKey: customerKeys.profile(customerId),
		queryFn: () => getCustomerProfile({ data: { customerId } }),
	});
}
