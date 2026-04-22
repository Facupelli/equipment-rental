import { OrderItemType } from "@repo/types";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { Dayjs } from "dayjs";
import {
	ArrowRight,
	CalendarDays,
	Clock,
	Mail,
	MapPin,
	Package,
	Tag,
	User,
	X,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { useScheduleParams } from "@/features/orders/hooks/use-schedule-params";
import { formatOrderNumber } from "@/features/orders/order.utils";
import {
	type ParsedScheduleEvent,
	useCalendarDots,
	useUpcomingSchedule,
} from "@/features/orders/orders.queries";
import {
	createOrderDetailQueryOptions,
	type ParsedOrderDetailResponseDto,
} from "@/features/orders/queries/get-order-by-id";
import { locationQueries } from "@/features/tenant/locations/locations.queries";
import dayjs from "@/lib/dates/dayjs";
import { formatDateShort } from "@/lib/dates/format";
import { localDateToDateParam } from "@/lib/dates/parse";
import { cn } from "@/lib/utils";
import { AdminRouteError } from "@/shared/components/admin-route-error";
import { useSelectedLocation } from "@/shared/contexts/location/location.hooks";

const searchSchema = z.object({
	date: z.iso.date().optional(),
	orderId: z.string().optional(),
});

export const Route = createFileRoute("/_admin/dashboard/schedule/")({
	validateSearch: searchSchema,
	errorComponent: ({ error }) => {
		return (
			<AdminRouteError
				error={error}
				genericMessage="No pudimos cargar la lista de horarios."
				forbiddenMessage="No tienes permisos para ver los horarios."
			/>
		);
	},
	component: TodaySchedulePage,
});

export type ScheduleRoute = typeof Route;

function labelToDate(label: string): Date {
	const [y, m, d] = label.split("-").map(Number);
	return new Date(y, m - 1, d);
}

function dateToLabel(d: Date): string {
	return dayjs(d).format("YYYY-MM-DD");
}

function TodaySchedulePage() {
	const { data: locations } = useSuspenseQuery(locationQueries.list());
	const selectedLocation = useSelectedLocation(locations);
	const timezone = selectedLocation?.effectiveTimezone ?? "UTC";

	const {
		selectedDate,
		isToday,
		monthFrom,
		monthTo,
		selectedOrderId,
		setDate,
		setOrderId,
	} = useScheduleParams(Route, timezone);

	const displayLabel = isToday
		? "Today"
		: dayjs(selectedDate, "YYYY-MM-DD").format("MMMM D, YYYY");

	// Deselect on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape" && selectedOrderId) setOrderId(undefined);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [selectedOrderId, setOrderId]);

	if (!selectedLocation) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
					Selecciona una ubicacion para ver el cronograma.
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col gap-6 p-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<p className="text-muted-foreground text-sm">Schedule</p>
					<h1 className="text-2xl font-semibold tracking-tight">
						{displayLabel}
					</h1>
				</div>

				{selectedOrderId && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setOrderId(undefined)}
					>
						<CalendarDays className="mr-1.5 h-4 w-4" />
						Show Calendar
					</Button>
				)}
			</div>

			{/* Body */}
			<div className="grid flex-1 grid-cols-[1fr_400px] gap-6 overflow-hidden">
				<ScheduleContent
					locationId={selectedLocation.id}
					date={selectedDate}
					selectedOrderId={selectedOrderId}
					onOrderSelect={(id) =>
						setOrderId(id === selectedOrderId ? undefined : id)
					}
					timezone={timezone}
				/>

				{selectedOrderId ? (
					<OrderQuickPanel
						orderId={selectedOrderId}
						timezone={timezone}
						onClose={() => setOrderId(undefined)}
					/>
				) : (
					<ScheduleSidebar
						locationId={selectedLocation.id}
						selectedDate={selectedDate}
						monthFrom={monthFrom}
						monthTo={monthTo}
						onDayClick={setDate}
					/>
				)}
			</div>
		</div>
	);
}

// ─── Schedule Content ─────────────────────────────────────────────────────────

interface ScheduleContentProps {
	locationId: string;
	date: string;
	selectedOrderId: string | undefined;
	onOrderSelect: (id: string) => void;
	timezone: string;
}

function ScheduleContent({
	locationId,
	date,
	selectedOrderId,
	onOrderSelect,
	timezone,
}: ScheduleContentProps) {
	const { data, isPending, isError } = useUpcomingSchedule({
		locationId,
		from: date,
		to: date,
	});

	if (isError) {
		return (
			<div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
				Failed to load schedule.
			</div>
		);
	}

	const pickups = (
		data?.events.filter((e) => e.eventType === "PICKUP") ?? []
	).sort((a, b) => a.eventAt.valueOf() - b.eventAt.valueOf());
	const returns = (
		data?.events.filter((e) => e.eventType === "RETURN") ?? []
	).sort((a, b) => a.eventAt.valueOf() - b.eventAt.valueOf());

	return (
		<div className="flex flex-col gap-6 overflow-y-auto">
			<EventSection
				title="Pickups"
				count={pickups.length}
				events={pickups}
				isPending={isPending}
				emptyMessage="No pickups scheduled"
				selectedOrderId={selectedOrderId}
				onOrderSelect={onOrderSelect}
				timezone={timezone}
			/>
			<EventSection
				title="Returns"
				count={returns.length}
				events={returns}
				isPending={isPending}
				emptyMessage="No returns scheduled"
				selectedOrderId={selectedOrderId}
				onOrderSelect={onOrderSelect}
				timezone={timezone}
			/>
		</div>
	);
}

// ─── Event Section ────────────────────────────────────────────────────────────

interface EventSectionProps {
	title: string;
	count: number;
	events: ParsedScheduleEvent[];
	isPending: boolean;
	emptyMessage: string;
	selectedOrderId: string | undefined;
	onOrderSelect: (id: string) => void;
	timezone: string;
}

function EventSection({
	title,
	count,
	events,
	isPending,
	emptyMessage,
	selectedOrderId,
	onOrderSelect,
	timezone,
}: EventSectionProps) {
	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<h2 className="font-medium">{title}</h2>
				{!isPending && (
					<Badge variant="secondary" className="tabular-nums">
						{count}
					</Badge>
				)}
			</div>

			<div className="flex flex-col gap-2">
				{isPending ? (
					<>
						<EventCardSkeleton />
						<EventCardSkeleton />
						<EventCardSkeleton />
					</>
				) : events.length === 0 ? (
					<p className="text-muted-foreground py-4 text-center text-sm">
						{emptyMessage}
					</p>
				) : (
					events.map((event) => (
						<EventCard
							key={event.order.id}
							event={event}
							isSelected={selectedOrderId === event.order.id}
							onSelect={onOrderSelect}
							timezone={timezone}
						/>
					))
				)}
			</div>
		</section>
	);
}

// ─── Event Card ───────────────────────────────────────────────────────────────

interface EventCardProps {
	event: ParsedScheduleEvent;
	isSelected: boolean;
	onSelect: (id: string) => void;
	timezone: string;
}

function EventCard({ event, isSelected, onSelect, timezone }: EventCardProps) {
	const { order } = event;
	const queryClient = useQueryClient();

	const dateRange = `${formatDateShort(order.pickupDate)} – ${formatDateShort(order.returnDate)}`;

	const handleMouseEnter = useCallback(() => {
		queryClient.prefetchQuery(
			createOrderDetailQueryOptions({ orderId: order.id }),
		);
	}, [order.id, queryClient]);

	return (
		<button
			type="button"
			className={cn(
				"border-border flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-all duration-150",
				isSelected
					? "bg-foreground border-foreground"
					: "bg-card hover:border-foreground/30 hover:shadow-sm",
			)}
			onMouseEnter={handleMouseEnter}
			onClick={() => onSelect(order.id)}
		>
			<div className="min-w-0 flex-1">
				<div className="flex items-start gap-4">
					<p
						className={cn(
							"font-mono text-xs",
							isSelected ? "text-background/60" : "text-muted-foreground",
						)}
					>
						{event.eventAt.tz(timezone).format("HH:mm")}
					</p>
					<div>
						<div className="flex items-center gap-2">
							<span
								className={cn(
									"font-mono text-xs",
									isSelected ? "text-background/60" : "text-muted-foreground",
								)}
							>
								{formatOrderNumber(order.number)}
							</span>
							<span
								className={cn(
									"truncate text-sm font-medium",
									isSelected ? "text-background" : "text-foreground",
								)}
							>
								{order.customer ? order.customer.displayName : "No customer"}
							</span>
						</div>
						<div className="mt-0.5 flex items-center gap-2">
							<p
								className={cn(
									"text-xs",
									isSelected ? "text-background/50" : "text-muted-foreground",
								)}
							>
								{dateRange}
							</p>
						</div>
					</div>
				</div>
			</div>

			<OrderStatusBadge status={order.status} />
		</button>
	);
}

function EventCardSkeleton() {
	return (
		<div className="border-border flex items-center gap-4 rounded-lg border px-4 py-3">
			<div className="flex-1 space-y-2">
				<Skeleton className="h-3.5 w-48" />
				<Skeleton className="h-3 w-32" />
			</div>
			<Skeleton className="h-5 w-16 rounded-full" />
		</div>
	);
}

// ─── Order Quick Panel ────────────────────────────────────────────────────────

function OrderQuickPanel({
	orderId,
	onClose,
	timezone,
}: {
	orderId: string;
	onClose: () => void;
	timezone: string;
}) {
	// Resolves instantly from prefetch cache in the happy path
	const { data: order } = useSuspenseQuery(
		createOrderDetailQueryOptions({ orderId }),
	);

	return (
		<div className="bg-card border-border flex h-full min-h-0 flex-col overflow-hidden rounded-lg border">
			{/* Header */}
			<div className="flex items-start justify-between border-b px-5 py-4">
				<div>
					<div className="flex items-center gap-2">
						<h2 className="text-base font-semibold tracking-tight">
							Order #{formatOrderNumber(order.number)}
						</h2>
						<OrderStatusBadge status={order.status} />
					</div>
					<p className="text-muted-foreground mt-0.5 text-xs">
						Fulfillment view
					</p>
				</div>

				<button
					type="button"
					onClick={onClose}
					className="text-muted-foreground hover:text-foreground hover:bg-muted mt-0.5 rounded-md p-1 transition-colors"
					aria-label="Close panel"
				>
					<X className="h-4 w-4" />
				</button>
			</div>

			{/* Body */}
			<ScrollArea className="min-h-0 flex-1">
				<div className="space-y-6 px-5 py-5">
					{order.customer && (
						<PanelSection
							icon={<User className="h-3.5 w-3.5" />}
							label="Customer"
						>
							<p className="text-sm font-semibold">
								{order.customer.isCompany && order.customer.companyName
									? order.customer.companyName
									: `${order.customer.firstName} ${order.customer.lastName}`}
							</p>
							{order.customer.isCompany && (
								<p className="text-muted-foreground mt-0.5 text-xs">
									{order.customer.firstName} {order.customer.lastName}
								</p>
							)}
							<div className="text-muted-foreground mt-2 flex items-center gap-1.5">
								<Mail className="h-3 w-3 shrink-0" />
								<span className="text-xs">{order.customer.email}</span>
							</div>
						</PanelSection>
					)}

					<PanelSection
						icon={<Clock className="h-3.5 w-3.5" />}
						label="Periodo de alquiler"
					>
						<div className="grid grid-cols-2 gap-2">
							<PeriodCell
								label="Pickup"
								date={order.bookingSnapshot.pickupDate}
								time={order.pickupAt}
								timezone={timezone}
							/>
							<PeriodCell
								label="Return"
								date={order.bookingSnapshot.returnDate}
								time={order.returnAt}
								timezone={timezone}
							/>
						</div>
					</PanelSection>

					<PanelSection
						icon={<MapPin className="h-3.5 w-3.5" />}
						label="Location"
					>
						<p className="text-sm font-semibold">{order.location.name}</p>
					</PanelSection>

					<PanelSection
						icon={<Package className="h-3.5 w-3.5" />}
						label="Equipment"
					>
						<div className="space-y-2">
							{order.items.map((item) => (
								<EquipmentRow key={item.id} item={item} />
							))}
						</div>
					</PanelSection>

					{order.notes && (
						<PanelSection icon={<Tag className="h-3.5 w-3.5" />} label="Notes">
							<p className="text-sm leading-relaxed">{order.notes}</p>
						</PanelSection>
					)}
				</div>
			</ScrollArea>

			{/* Footer */}
			<div className="border-t px-5 py-4">
				<Link
					to="/dashboard/orders/$orderId"
					params={{ orderId }}
					className="bg-foreground text-background hover:bg-foreground/90 flex h-10 w-full items-center justify-between rounded-md px-4 text-sm font-medium transition-colors"
				>
					View Full Order
					<ArrowRight className="h-4 w-4" />
				</Link>
			</div>
		</div>
	);
}

// ─── Panel Primitives ─────────────────────────────────────────────────────────

function PanelSection({
	icon,
	label,
	children,
}: {
	icon: React.ReactNode;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className="text-muted-foreground mb-2.5 flex items-center gap-1.5">
				{icon}
				<span className="font-mono text-[10px] uppercase tracking-widest">
					{label}
				</span>
			</div>
			{children}
		</div>
	);
}

function PeriodCell({
	label,
	date,
	time,
	timezone,
}: {
	label: string;
	date: Dayjs;
	time: Dayjs;
	timezone: string;
}) {
	const localTime = time.tz(timezone);
	return (
		<div className="bg-muted/50 rounded-md border px-3 py-2.5">
			<p className="text-muted-foreground mb-1 font-mono text-[9px] uppercase tracking-widest">
				{label}
			</p>
			<p className="text-sm font-semibold">{formatDateShort(date)}</p>
			<p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
				{localTime.format("HH:mm")}
			</p>
		</div>
	);
}

function EquipmentRow({
	item,
}: {
	item: ParsedOrderDetailResponseDto["items"][number];
}) {
	const isBundle = item.type === OrderItemType.BUNDLE;

	return (
		<div className="bg-muted/40 rounded-md border px-3.5 py-3">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<p className="text-sm font-semibold leading-snug">{item.name}</p>
						{isBundle && (
							<Badge
								variant="secondary"
								className="h-4 rounded px-1.5 font-mono text-[9px] uppercase tracking-wide"
							>
								Bundle
							</Badge>
						)}
					</div>
					{isBundle && item.components.length > 0 && (
						<p className="text-muted-foreground mt-1 text-[11px]">
							{item.components
								.map((c) => `${c.quantity}× ${c.productTypeName}`)
								.join(" · ")}
						</p>
					)}
				</div>
				<span className="text-muted-foreground shrink-0 font-mono text-xs">
					×{item.assets.length || 1}
				</span>
			</div>

			{item.assets.length > 0 && (
				<div className="mt-2.5 space-y-1">
					{item.assets.map((asset) => (
						<div key={asset.id} className="flex items-center gap-1.5">
							<div className="bg-muted-foreground/30 h-1 w-1 shrink-0 rounded-full" />
							<span className="text-muted-foreground font-mono text-[10px]">
								{asset.serialNumber
									? `S/N: ${asset.serialNumber}`
									: "No serial number assigned"}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Schedule Sidebar (unchanged) ─────────────────────────────────────────────

interface ScheduleSidebarProps {
	locationId: string;
	selectedDate: string;
	monthFrom: string;
	monthTo: string;
	onDayClick: (date: Date) => void;
}

function ScheduleSidebar({
	locationId,
	selectedDate,
	monthFrom,
	monthTo,
	onDayClick,
}: ScheduleSidebarProps) {
	const { data, isPending } = useCalendarDots({
		locationId,
		from: monthFrom,
		to: monthTo,
	});

	const pickupDates = new Set(data?.pickupDates ?? []);
	const returnDates = new Set(data?.returnDates ?? []);

	const pickupModifier = (date: Date) =>
		pickupDates.has(localDateToDateParam(date));

	const returnModifier = (date: Date) =>
		returnDates.has(localDateToDateParam(date));

	const today = dateToLabel(new Date());
	const pastModifier = (d: Date) => dateToLabel(d) < today;

	return (
		<div className="flex flex-col items-center gap-4">
			<div className="bg-card border-border rounded-lg border p-3">
				<Calendar
					mode="single"
					selected={labelToDate(selectedDate)}
					onDayClick={onDayClick}
					modifiers={{
						hasPickup: pickupModifier,
						hasReturn: returnModifier,
						isPast: pastModifier,
					}}
					modifiersClassNames={{
						hasPickup: "has-pickup",
						hasReturn: "has-return",
						isPast: "is-past",
					}}
					classNames={{
						day: cn(
							"relative",
							"[&.has-pickup]:after:bg-primary [&.has-pickup]:after:absolute [&.has-pickup]:after:bottom-1 [&.has-pickup]:after:left-1/2 [&.has-pickup]:after:-translate-x-1/2 [&.has-pickup]:after:h-1 [&.has-pickup]:after:w-1 [&.has-pickup]:after:rounded-full",
							"[&.has-return]:before:bg-emerald-500 [&.has-return]:before:absolute [&.has-return]:before:bottom-1 [&.has-return]:before:left-[calc(50%+4px)] [&.has-return]:before:h-1 [&.has-return]:before:w-1 [&.has-return]:before:rounded-full",
							"[&.is-past.has-pickup]:after:opacity-35",
							"[&.is-past.has-return]:before:opacity-35",
						),
					}}
					disabled={isPending}
				/>
			</div>

			<div className="flex items-center gap-4 px-1">
				<div className="flex items-center gap-1.5">
					<span className="bg-primary h-2 w-2 rounded-full" />
					<span className="text-muted-foreground text-xs">Pickups</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="bg-emerald-500 h-2 w-2 rounded-full" />
					<span className="text-muted-foreground text-xs">Returns</span>
				</div>
			</div>
		</div>
	);
}
