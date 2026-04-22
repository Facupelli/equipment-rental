import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useOrdersCalendar } from "@/features/orders/orders.queries";
import { locationQueries } from "@/features/tenant/locations/locations.queries";
import { useSelectedLocation } from "@/shared/contexts/location/location.hooks";
import { OrdersCalendar } from "./orders-calendar";
import {
	DEFAULT_ORDERS_CALENDAR_VIEW,
	getDefaultOrdersCalendarDate,
	type OrdersCalendarRange,
	type OrdersCalendarSearch,
} from "./orders-calendar.utils";

type OrdersCalendarPageProps = {
	search: OrdersCalendarSearch;
	onSearchChange: (search: OrdersCalendarSearch, replace?: boolean) => void;
};

export function OrdersCalendarPage({
	search,
	onSearchChange,
}: OrdersCalendarPageProps) {
	const navigate = useNavigate();
	const { data: locations } = useSuspenseQuery(locationQueries.list());
	const selectedLocation = useSelectedLocation(locations);
	const timezone = selectedLocation?.effectiveTimezone ?? "UTC";
	const currentView = search.view ?? DEFAULT_ORDERS_CALENDAR_VIEW;
	const currentDate = search.date ?? getDefaultOrdersCalendarDate(timezone);
	const [visibleRange, setVisibleRange] = useState<OrdersCalendarRange | null>(
		null,
	);

	const { data, isPending, isFetching, isError } = useOrdersCalendar(
		{
			locationId: selectedLocation?.id ?? "",
			rangeStart: visibleRange?.rangeStart ?? "",
			rangeEnd: visibleRange?.rangeEnd ?? "",
		},
		{
			enabled: Boolean(selectedLocation && visibleRange),
		},
	);

	function handleRangeChange(nextRange: OrdersCalendarRange) {
		setVisibleRange(nextRange);

		if (search.view === nextRange.view && search.date === nextRange.date) {
			return;
		}

		onSearchChange(
			{
				view: nextRange.view,
				date: nextRange.date,
			},
			!search.view || !search.date,
		);
	}

	if (!selectedLocation) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
					Selecciona una ubicacion para ver el calendario.
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-2">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">
							Calendario
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Visualiza pedidos en el tiempo para leer densidad, solapes y carga
							operativa de un vistazo.
						</p>
					</div>
				</div>

				<div className="text-right text-xs text-muted-foreground">
					<p>{timezone}</p>
					<p>{isFetching ? "Actualizando pedidos" : "Confirmados y activos"}</p>
				</div>
			</div>

			<OrdersCalendar
				currentDate={currentDate}
				currentView={currentView}
				timezone={timezone}
				orders={data?.orders ?? []}
				isLoading={isPending && !visibleRange}
				isFetching={isFetching}
				isError={isError}
				onRangeChange={handleRangeChange}
				onOrderClick={(orderId) =>
					navigate({
						to: "/dashboard/orders/$orderId",
						params: { orderId },
					})
				}
			/>
		</div>
	);
}
