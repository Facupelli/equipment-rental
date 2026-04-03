import type {
	CustomDomainResponse,
	RegisterCustomDomainDto,
	RegisterCustomDomainResponse,
} from "@repo/schemas";
import {
	queryOptions,
	type UseMutationOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { ProblemDetailsError } from "@/shared/errors";
import { tenantKeys } from "../tenant.queries";
import {
	getCustomDomain,
	refreshCustomDomainStatus,
	registerCustomDomain,
} from "./custom-domain.api";

export const customDomainKeys = {
	all: () => ["tenant-custom-domain"] as const,
	current: () => [...customDomainKeys.all(), "current"] as const,
};

export const customDomainQueries = {
	current: () =>
		queryOptions({
			queryKey: customDomainKeys.current(),
			queryFn: () => getCustomDomain(),
			staleTime: 30 * 1000,
		}),
};

type RegisterCustomDomainOptions = Omit<
	UseMutationOptions<
		RegisterCustomDomainResponse,
		ProblemDetailsError,
		RegisterCustomDomainDto
	>,
	"mutationFn" | "mutationKey"
>;

type RefreshCustomDomainOptions = Omit<
	UseMutationOptions<CustomDomainResponse, ProblemDetailsError, void>,
	"mutationFn" | "mutationKey"
>;

export function useCustomDomain() {
	return useQuery(customDomainQueries.current());
}

export function useRegisterCustomDomain(options?: RegisterCustomDomainOptions) {
	const queryClient = useQueryClient();

	return useMutation<
		RegisterCustomDomainResponse,
		ProblemDetailsError,
		RegisterCustomDomainDto
	>({
		...options,
		mutationFn: (data) => registerCustomDomain({ data }),
		meta: {
			invalidates: customDomainKeys.all(),
		},
		onSuccess: async (data, variables, onMutateResult, context) => {
			await queryClient.invalidateQueries({
				queryKey: tenantKeys.all(),
			});

			await options?.onSuccess?.(data, variables, onMutateResult, context);
		},
	});
}

export function useRefreshCustomDomain(options?: RefreshCustomDomainOptions) {
	const queryClient = useQueryClient();

	return useMutation<CustomDomainResponse, ProblemDetailsError, void>({
		...options,
		mutationFn: () => refreshCustomDomainStatus({ data: undefined }),
		meta: {
			invalidates: customDomainKeys.all(),
		},
		onSuccess: async (data, variables, onMutateResult, context) => {
			await queryClient.invalidateQueries({
				queryKey: tenantKeys.all(),
			});

			await options?.onSuccess?.(data, variables, onMutateResult, context);
		},
	});
}
