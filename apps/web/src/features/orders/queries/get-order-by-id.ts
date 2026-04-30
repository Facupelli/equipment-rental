import type {
	GetOrderByIdParamDto,
	OrderDetailResponseDto,
} from "@repo/schemas";
import { type UseSuspenseQueryOptions, useQuery } from "@tanstack/react-query";
import type { Dayjs } from "dayjs";
import { fromDate, fromDateParam, parseTimestamp } from "@/lib/dates/parse";
import type { ProblemDetailsError } from "@/shared/errors";
import { getOrderById } from "../orders.api";
import { orderKeys } from "../orders.queries";

// TODO: replace parseDailyBound with parseTimestamp for hourly orders once
// rentalType is available on OrderDetailResponseDto (tracked: BillingUnit.type).
export type ParsedOrderPeriod = {
	start: Dayjs;
	end: Dayjs;
};

export type ParsedOrderDetailResponseDto = Omit<
	OrderDetailResponseDto,
	| "period"
	| "createdAt"
	| "bookingSnapshot"
	| "pickupAt"
	| "returnAt"
	| "financial"
	| "signing"
> & {
	period: ParsedOrderPeriod | null;
	createdAt: Dayjs;
	bookingSnapshot: Omit<
		OrderDetailResponseDto["bookingSnapshot"],
		"pickupDate" | "returnDate"
	> & {
		pickupDate: Dayjs;
		returnDate: Dayjs;
	};
	pickupAt: Dayjs;
	returnAt: Dayjs;
	financial: Omit<OrderDetailResponseDto["financial"], "items"> & {
		items: Array<
			Omit<OrderDetailResponseDto["financial"]["items"][number], "pricing"> & {
				pricing: Omit<
					OrderDetailResponseDto["financial"]["items"][number]["pricing"],
					"manualOverride"
				> & {
					manualOverride:
						| (Omit<
								NonNullable<
									OrderDetailResponseDto["financial"]["items"][number]["pricing"]["manualOverride"]
								>,
								"setAt"
							> & {
								setAt: Dayjs | null;
							})
						| null;
				};
			}
		>;
	};
	signing: Omit<
		OrderDetailResponseDto["signing"],
		"createdAt" | "expiresAt" | "openedAt" | "signedAt" | "latestInvitationDelivery" | "latestFinalCopyDelivery"
	> & {
		createdAt: Dayjs | null;
		expiresAt: Dayjs | null;
		openedAt: Dayjs | null;
		signedAt: Dayjs | null;
		latestInvitationDelivery: Omit<
			OrderDetailResponseDto["signing"]["latestInvitationDelivery"],
			"occurredAt"
		> & {
			occurredAt: Dayjs | null;
		};
		latestFinalCopyDelivery: Omit<
			OrderDetailResponseDto["signing"]["latestFinalCopyDelivery"],
			"occurredAt"
		> & {
			occurredAt: Dayjs | null;
		};
	};
};

// -----------------------------------------------------

type GetOrderByIdQueryOptions<TData = OrderDetailResponseDto> = Omit<
	UseSuspenseQueryOptions<OrderDetailResponseDto, ProblemDetailsError, TData>,
	"queryKey" | "queryFn"
>;

// -----------------------------------------------------

function parseOrderDetailResponse(
	raw: OrderDetailResponseDto,
): ParsedOrderDetailResponseDto {
	return {
		...raw,
		bookingSnapshot: {
			...raw.bookingSnapshot,
			pickupDate: fromDateParam(raw.bookingSnapshot.pickupDate),
			returnDate: fromDateParam(raw.bookingSnapshot.returnDate),
		},
		pickupAt: requireDayjs(parseTimestamp(raw.pickupAt), "pickupAt"),
		returnAt: requireDayjs(parseTimestamp(raw.returnAt), "returnAt"),
		// TODO: route through parseTimestamp for hourly orders once rentalType is available
		period: raw.period
			? {
					start: fromDate(raw.period.start),
					end: fromDate(raw.period.end),
				}
			: null,
		createdAt: requireDayjs(parseTimestamp(raw.createdAt), "createdAt"),
		financial: {
			...raw.financial,
			items: raw.financial.items.map((item) => ({
				...item,
				pricing: {
					...item.pricing,
					manualOverride: item.pricing.manualOverride
						? {
							...item.pricing.manualOverride,
							setAt: parseTimestamp(item.pricing.manualOverride.setAt),
						}
						: null,
				},
			})),
		},
		signing: {
			...raw.signing,
			createdAt: parseTimestamp(raw.signing.createdAt),
			expiresAt: parseTimestamp(raw.signing.expiresAt),
			openedAt: parseTimestamp(raw.signing.openedAt),
			signedAt: parseTimestamp(raw.signing.signedAt),
			latestInvitationDelivery: {
				...raw.signing.latestInvitationDelivery,
				occurredAt: parseTimestamp(raw.signing.latestInvitationDelivery.occurredAt),
			},
			latestFinalCopyDelivery: {
				...raw.signing.latestFinalCopyDelivery,
				occurredAt: parseTimestamp(raw.signing.latestFinalCopyDelivery.occurredAt),
			},
		},
	};
}

// -----------------------------------------------------

export function createOrderDetailQueryOptions<
	TData = ParsedOrderDetailResponseDto,
>(
	params: GetOrderByIdParamDto,
	options?: GetOrderByIdQueryOptions<TData>,
): UseSuspenseQueryOptions<OrderDetailResponseDto, ProblemDetailsError, TData> {
	return {
		...options,
		queryKey: orderKeys.detail(params),
		queryFn: () => getOrderById({ data: params }),
		select: (raw) => parseOrderDetailResponse(raw) as TData,
	};
}

// -----------------------------------------------------

export function useOrderDetail<TData = ParsedOrderDetailResponseDto>(
	params: GetOrderByIdParamDto,
	options?: GetOrderByIdQueryOptions<TData>,
) {
	return useQuery({
		...createOrderDetailQueryOptions(params, options),
	});
}

function requireDayjs(value: Dayjs | null, field: string): Dayjs {
	if (!value) {
		throw new Error(`Invalid order detail date: ${field}`);
	}
	return value;
}
