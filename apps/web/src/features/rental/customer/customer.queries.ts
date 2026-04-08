import type {
	CustomerProfile,
	CustomerProfileResponseDto,
	MeCustomerResponseDto,
	ProblemDetails,
} from "@repo/schemas";
import {
	queryOptions,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { ProblemDetailsError } from "@/shared/errors";
import {
	getCurrentCustomerProfile,
	getMeCustomer,
	resubmitCustomerProfile,
	submitCustomerProfile,
} from "./customer.api";

export const portalCustomerKeys = {
	all: () => ["portal-customer"] as const,
	me: () => [...portalCustomerKeys.all(), "me"] as const,
	profile: () => [...portalCustomerKeys.all(), "profile"] as const,
};

export const portalCustomerQueries = {
	me: () =>
		queryOptions<MeCustomerResponseDto, ProblemDetailsError>({
			queryKey: portalCustomerKeys.me(),
			queryFn: () => getMeCustomer(),
			staleTime: 5 * 60 * 1000,
		}),
	profile: () =>
		queryOptions<CustomerProfileResponseDto, ProblemDetailsError>({
			queryKey: portalCustomerKeys.profile(),
			queryFn: () => getCurrentCustomerProfile(),
			staleTime: 5 * 60 * 1000,
		}),
};

type CurrentCustomerOptions<TData = MeCustomerResponseDto> = Omit<
	UseQueryOptions<MeCustomerResponseDto, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type CurrentCustomerProfileOptions<TData = CustomerProfileResponseDto> = Omit<
	UseQueryOptions<CustomerProfileResponseDto, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type CustomerProfileMutationOptions = Omit<
	UseMutationOptions<void, ProblemDetailsError, CustomerProfile>,
	"mutationFn"
>;

function toProblemDetailsError(result: { error: ProblemDetails }): never {
	throw new ProblemDetailsError(result.error);
}

export function useCurrentCustomer<TData = MeCustomerResponseDto>(
	options?: CurrentCustomerOptions<TData>,
) {
	return useQuery({
		...options,
		...portalCustomerQueries.me(),
	});
}

export function useCurrentCustomerProfile<TData = CustomerProfileResponseDto>(
	options?: CurrentCustomerProfileOptions<TData>,
) {
	return useQuery({
		...options,
		...portalCustomerQueries.profile(),
	});
}

export function useSubmitCustomerProfile(
	options?: CustomerProfileMutationOptions,
) {
	return useMutation<void, ProblemDetailsError, CustomerProfile>({
		...options,
		mutationFn: async (data) => {
			const result = await submitCustomerProfile({ data });

			if (typeof result === "object" && result !== null && "error" in result) {
				toProblemDetailsError(result);
			}
		},
		meta: {
			invalidates: portalCustomerKeys.all(),
		},
	});
}

export function useResubmitCustomerProfile(
	options?: CustomerProfileMutationOptions,
) {
	return useMutation<void, ProblemDetailsError, CustomerProfile>({
		...options,
		mutationFn: async (data) => {
			const result = await resubmitCustomerProfile({ data });

			if (typeof result === "object" && result !== null && "error" in result) {
				toProblemDetailsError(result);
			}
		},
		meta: {
			invalidates: portalCustomerKeys.all(),
		},
	});
}
