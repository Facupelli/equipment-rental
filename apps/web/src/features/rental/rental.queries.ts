import type {
	BundleListResponseDto,
	CalculateCartPricesRequest,
	CartPriceResult,
	GetCombosParams,
	GetNewArrivalsParams,
	GetRentalProductTypesQuery,
	NewArrivalListResponseDto,
	PaginatedDto,
	RentalProductResponse,
} from "@repo/schemas";
import {
	keepPreviousData,
	queryOptions,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { usePortalTenantId } from "@/features/tenant-context/use-portal-tenant-id";
import type { ProblemDetailsError } from "@/shared/errors";
import {
	getCartPricePreview,
	getNewArrivals,
	getRentalBundles,
	getRentalProducts,
} from "./rental.api";

type PaginatedRentalProducts = PaginatedDto<RentalProductResponse>;

// -----------------------------------------------------
// Key Factory
// -----------------------------------------------------

export const rentalKeys = {
	all: (tenantId: string) => ["rental", tenantId] as const,
	products: (tenantId: string) =>
		[...rentalKeys.all(tenantId), "products"] as const,
	product: (tenantId: string, params: GetRentalProductTypesQuery) => {
		const hasDateRange = !!params.pickupDate && !!params.returnDate;
		return [
			...rentalKeys.products(tenantId),
			{
				...params,
				pickupDate: hasDateRange ? params.pickupDate : undefined,
				returnDate: hasDateRange ? params.returnDate : undefined,
			},
		] as const;
	},
	newArrivals: (tenantId: string) =>
		[...rentalKeys.all(tenantId), "new-arrivals"] as const,
	newArrival: (tenantId: string, params: GetNewArrivalsParams) =>
		[...rentalKeys.newArrivals(tenantId), params] as const,
	bundles: (tenantId: string) =>
		[...rentalKeys.all(tenantId), "bundles"] as const,
	bundle: (tenantId: string, params: GetCombosParams) => {
		const hasDateRange = !!params.pickupDate && !!params.returnDate;
		return [
			...rentalKeys.bundles(tenantId),
			{
				...params,
				pickupDate: hasDateRange ? params.pickupDate : undefined,
				returnDate: hasDateRange ? params.returnDate : undefined,
			},
		] as const;
	},
	cartPreviews: (tenantId: string) =>
		[...rentalKeys.all(tenantId), "cart-preview"] as const,
	cartPreview: (tenantId: string, params: CalculateCartPricesRequest) =>
		[...rentalKeys.cartPreviews(tenantId), params] as const,
};

export const rentalQueries = {
	products: (tenantId: string, params: GetRentalProductTypesQuery) => {
		const normalizedParams =
			params.pickupDate && params.returnDate
				? params
				: {
						...params,
						pickupDate: undefined,
						returnDate: undefined,
					};

		return queryOptions<PaginatedRentalProducts, ProblemDetailsError>({
			queryKey: rentalKeys.product(tenantId, params),
			queryFn: () => getRentalProducts({ data: normalizedParams }),
			placeholderData: keepPreviousData,
		});
	},
	newArrivals: (tenantId: string, params: GetNewArrivalsParams) =>
		queryOptions<NewArrivalListResponseDto, ProblemDetailsError>({
			queryKey: rentalKeys.newArrival(tenantId, params),
			queryFn: () => getNewArrivals({ data: params }),
		}),
	bundles: (tenantId: string, params: GetCombosParams) => {
		const normalizedParams =
			params.pickupDate && params.returnDate
				? params
				: {
						...params,
						pickupDate: undefined,
						returnDate: undefined,
					};

		return queryOptions<BundleListResponseDto, ProblemDetailsError>({
			queryKey: rentalKeys.bundle(tenantId, params),
			queryFn: () => getRentalBundles({ data: normalizedParams }),
			placeholderData: keepPreviousData,
		});
	},
};

// -----------------------------------------------------
// Types
// -----------------------------------------------------

type RentalProductsQueryOptions<TData = PaginatedRentalProducts> = Omit<
	UseQueryOptions<PaginatedRentalProducts, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type NewArrivalsQueryOptions<TData = NewArrivalListResponseDto> = Omit<
	UseQueryOptions<NewArrivalListResponseDto, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type RentalBundlesQueryOptions<TData = BundleListResponseDto> = Omit<
	UseQueryOptions<BundleListResponseDto, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

type CartPricePreviewQueryOptions<TData = CartPriceResult> = Omit<
	UseQueryOptions<CartPriceResult, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

// -----------------------------------------------------
// Hooks
// -----------------------------------------------------

export function useRentalProducts<TData = PaginatedRentalProducts>(
	params: GetRentalProductTypesQuery,
	options?: RentalProductsQueryOptions<TData>,
) {
	const tenantId = usePortalTenantId();
	const { queryKey, queryFn } = rentalQueries.products(tenantId, params);

	return useQuery({
		...options,
		queryKey,
		queryFn,
		placeholderData: keepPreviousData,
	});
}

export function useNewArrivals<TData = NewArrivalListResponseDto>(
	params: GetNewArrivalsParams,
	options?: NewArrivalsQueryOptions<TData>,
) {
	const tenantId = usePortalTenantId();
	const { queryKey, queryFn } = rentalQueries.newArrivals(tenantId, params);

	return useQuery({
		...options,
		queryKey,
		queryFn,
		placeholderData: keepPreviousData,
	});
}

export function useRentalBundles<TData = BundleListResponseDto>(
	params: GetCombosParams,
	options?: RentalBundlesQueryOptions<TData>,
) {
	const tenantId = usePortalTenantId();
	const { queryKey, queryFn } = rentalQueries.bundles(tenantId, params);

	return useQuery({
		...options,
		queryKey,
		queryFn,
		placeholderData: keepPreviousData,
	});
}

export function useCartPricePreview<TData = CartPriceResult>(
	params: CalculateCartPricesRequest,
	options?: CartPricePreviewQueryOptions<TData>,
) {
	const tenantId = usePortalTenantId();

	return useQuery({
		...options,
		queryKey: rentalKeys.cartPreview(tenantId, params),
		queryFn: () => getCartPricePreview({ data: params }),
		placeholderData: keepPreviousData,
	});
}
