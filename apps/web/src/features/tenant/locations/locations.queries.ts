import type {
	CreateLocationDto,
	LocationListResponse,
	RentalLocationsResponse,
	UpdateLocationDto,
} from "@repo/schemas";
import {
	queryOptions,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import type { ProblemDetailsError } from "@/shared/errors";
import {
	createLocation,
	deactivateLocation,
	getLocations,
	getRentalLocations,
	updateLocation,
} from "./locations.api";

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const locationKeys = {
	all: () => ["locations"] as const,
	lists: () => [...locationKeys.all(), "list"] as const,
};

export const locationQueries = {
	list: () =>
		queryOptions<LocationListResponse, ProblemDetailsError>({
			queryKey: locationKeys.lists(),
			queryFn: () => getLocations(),
		}),
};

export const rentalLocationKeys = {
	all: () => ["rental-locations"] as const,
	lists: () => [...rentalLocationKeys.all(), "list"] as const,
};

export const rentalLocationQueries = {
	list: () =>
		queryOptions<RentalLocationsResponse, ProblemDetailsError>({
			queryKey: rentalLocationKeys.lists(),
			queryFn: () => getRentalLocations(),
		}),
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type LocationQueryOptions<TData = LocationListResponse> = Omit<
	UseQueryOptions<LocationListResponse, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type RentalLocationQueryOptions<TData = RentalLocationsResponse> = Omit<
	UseQueryOptions<RentalLocationsResponse, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type LocationMutationOptions = Omit<
	UseMutationOptions<string, ProblemDetailsError, CreateLocationDto>,
	"mutationFn"
>;

type UpdateLocationMutationOptions = Omit<
	UseMutationOptions<
		void,
		ProblemDetailsError,
		{ locationId: string; dto: UpdateLocationDto }
	>,
	"mutationFn"
>;

type DeactivateLocationMutationOptions = Omit<
	UseMutationOptions<void, ProblemDetailsError, { locationId: string }>,
	"mutationFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useLocations<TData = LocationListResponse>(
	options?: LocationQueryOptions<TData>,
) {
	const { queryKey, queryFn } = locationQueries.list();

	return useQuery({
		...options,
		queryKey,
		queryFn,
	});
}

export function useRentalLocations<TData = RentalLocationsResponse>(
	options?: RentalLocationQueryOptions<TData>,
) {
	const { queryKey, queryFn } = rentalLocationQueries.list();

	return useQuery({
		...options,
		queryKey,
		queryFn,
	});
}

export function useCreateLocation(options?: LocationMutationOptions) {
	return useMutation<string, ProblemDetailsError, CreateLocationDto>({
		...options,
		mutationFn: (data) => createLocation({ data }),
		meta: {
			invalidates: locationKeys.lists(),
		},
	});
}

export function useUpdateLocation(options?: UpdateLocationMutationOptions) {
	return useMutation<
		void,
		ProblemDetailsError,
		{ locationId: string; dto: UpdateLocationDto }
	>({
		...options,
		mutationFn: (data) => updateLocation({ data }),
		meta: {
			invalidates: locationKeys.lists(),
		},
	});
}

export function useDeactivateLocation(
	options?: DeactivateLocationMutationOptions,
) {
	return useMutation<void, ProblemDetailsError, { locationId: string }>({
		...options,
		mutationFn: (data) => deactivateLocation({ data }),
		meta: {
			invalidates: locationKeys.lists(),
		},
	});
}
