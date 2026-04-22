import type { EventApi, EventInput } from "@fullcalendar/core";
import { formatOrderNumber } from "@/features/orders/order.utils";
import type { ParsedOrderCalendarItem } from "@/features/orders/orders.queries";
import dayjs from "@/lib/dates/dayjs";

export const ORDERS_CALENDAR_VIEWS = [
	"dayGridDay",
	"dayGridWeek",
	"dayGridMonth",
] as const;

export type OrdersCalendarView = (typeof ORDERS_CALENDAR_VIEWS)[number];

export type OrdersCalendarSearch = {
	view?: OrdersCalendarView;
	date?: string;
};

export type OrdersCalendarRange = {
	rangeStart: string;
	rangeEnd: string;
	title: string;
	view: OrdersCalendarView;
	date: string;
};

export type OrdersCalendarEventProps = {
	order: ParsedOrderCalendarItem;
};

export const DEFAULT_ORDERS_CALENDAR_VIEW: OrdersCalendarView = "dayGridWeek";

export const ORDERS_CALENDAR_VIEW_LABELS: Record<OrdersCalendarView, string> = {
	dayGridDay: "Dia",
	dayGridWeek: "Semana",
	dayGridMonth: "Mes",
};

export function getDefaultOrdersCalendarDate(timezone: string): string {
	return dayjs().tz(timezone).format("YYYY-MM-DD");
}

export function toOrdersCalendarEvent(
	order: ParsedOrderCalendarItem,
): EventInput {
	return {
		id: order.id,
		// These date-only fields are already derived by the backend in the
		// effective location timezone. Keep using them as canonical all-day
		// calendar bounds instead of recomputing from pickupAt/returnAt.
		start: toCalendarDateToken(order.pickupDate),
		end: toCalendarDateToken(order.returnDate),
		allDay: true,
		title: getOrdersCalendarEventTitle(order),
		extendedProps: {
			order,
		},
	};
}

export function getOrdersCalendarEventOrder(
	event: EventApi,
): ParsedOrderCalendarItem {
	return (event.extendedProps as OrdersCalendarEventProps).order;
}

export function getOrdersCalendarEventTitle(
	order: ParsedOrderCalendarItem,
): string {
	const label = order.customer?.displayName?.trim();
	return label
		? `#${formatOrderNumber(order.number)} ${label}`
		: `#${formatOrderNumber(order.number)}`;
}

export function formatOrdersCalendarTooltipDateTime(
	value: ParsedOrderCalendarItem["pickupAt"],
	timezone: string,
): string {
	return value.tz(timezone).format("ddd D MMM, HH:mm");
}

export function getOrdersCalendarStatusLabel(
	order: ParsedOrderCalendarItem,
): string {
	return order.status === "ACTIVE" ? "Activo" : "Pendiente";
}

function toCalendarDateToken(value: ParsedOrderCalendarItem["pickupDate"]): string {
	return value.format("YYYY-MM-DD");
}
