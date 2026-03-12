import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { z } from "zod";
import dayjs from "dayjs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useLocationId } from "@/shared/contexts/location/location.hooks";
import { parseDailyBound, toDateString } from "@/lib/dates/parse";
import {
  useCalendarDots,
  useUpcomingSchedule,
  type ParsedScheduleEvent,
} from "@/features/orders/orders.queries";
import { formatDateShort } from "@/lib/dates/format";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatOrderNumber } from "@/features/orders/order.utils";

const searchSchema = z.object({
  date: z.iso.date().optional(),
});

export const Route = createFileRoute("/_admin/dashboard/schedule/")({
  validateSearch: searchSchema,
  component: OrdersPage,
});

const authedRoute = getRouteApi("/_admin/dashboard");

function useScheduleParams(timezone: string) {
  const { date } = Route.useSearch();
  const navigate = Route.useNavigate();

  const today = dayjs().tz(timezone).format("YYYY-MM-DD");
  const selectedDate = date ?? today;
  const isToday = selectedDate === today;

  const d = dayjs(selectedDate, "YYYY-MM-DD");
  const monthFrom = d.startOf("month").format("YYYY-MM-DD");
  const monthTo = d.endOf("month").format("YYYY-MM-DD");

  const setDate = (d: Date) => {
    navigate({ search: { date: dayjs(d).format("YYYY-MM-DD") } });
  };

  return { selectedDate, isToday, monthFrom, monthTo, setDate };
}

function labelToDate(label: string): Date {
  const [y, m, d] = label.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function OrdersPage() {
  const {
    tenant: { config },
  } = authedRoute.useLoaderData();

  const { selectedDate, isToday, monthFrom, monthTo, setDate } =
    useScheduleParams(config.timezone);

  const locationId = useLocationId();

  const displayLabel = isToday
    ? "Today"
    : dayjs(selectedDate, "YYYY-MM-DD").format("MMMM D, YYYY");

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Schedule</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {displayLabel}
          </h1>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-[1fr_320px] gap-6">
        <ScheduleContent locationId={locationId} date={selectedDate} />
        <ScheduleSidebar
          locationId={locationId}
          selectedDate={selectedDate}
          monthFrom={monthFrom}
          monthTo={monthTo}
          onDayClick={setDate}
        />
      </div>
    </div>
  );
}

interface ScheduleContentProps {
  locationId: string;
  date: string;
}

function ScheduleContent({ locationId, date }: ScheduleContentProps) {
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

  const pickups = data?.events.filter((e) => e.eventType === "PICKUP") ?? [];
  const returns = data?.events.filter((e) => e.eventType === "RETURN") ?? [];

  return (
    <div className="flex flex-col gap-6">
      <EventSection
        title="Pickups"
        count={pickups.length}
        events={pickups}
        isPending={isPending}
        emptyMessage="No pickups scheduled"
      />
      <EventSection
        title="Returns"
        count={returns.length}
        events={returns}
        isPending={isPending}
        emptyMessage="No returns scheduled"
      />
    </div>
  );
}

interface EventSectionProps {
  title: string;
  count: number;
  events: ParsedScheduleEvent[];
  isPending: boolean;
  emptyMessage: string;
}

function EventSection({
  title,
  count,
  events,
  isPending,
  emptyMessage,
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
            <EventCard key={event.order.id} event={event} />
          ))
        )}
      </div>
    </section>
  );
}

interface EventCardProps {
  event: ParsedScheduleEvent;
}

function EventCard({ event }: EventCardProps) {
  const { order } = event;

  const dateRange = `${formatDateShort(order.periodStart)} – ${formatDateShort(order.periodEnd)}`;

  return (
    <div className="bg-card border-border flex items-center gap-4 rounded-lg border px-4 py-3">
      {/* Order number + date range */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono text-xs">
            {formatOrderNumber(order.number)}
          </span>
          <span className="text-foreground truncate text-sm font-medium">
            {order.customer ? order.customer.displayName : "No customer"}
          </span>
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">{dateRange}</p>
      </div>

      {/* Status */}
      <OrderStatusBadge status={order.status} />
    </div>
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

interface ScheduleSidebarProps {
  locationId: string;
  selectedDate: string;
  monthFrom: string;
  monthTo: string;
  onDayClick: (date: Date) => void;
}

function dateToLabel(d: Date): string {
  return dayjs(d).format("YYYY-MM-DD");
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

  // Convert YYYY-MM-DD strings → Date objects for DayPicker modifiers
  const pickupDates = new Set(data?.pickupDates ?? []);
  const returnDates = new Set(data?.returnDates ?? []);

  const pickupModifier = (date: Date) =>
    pickupDates.has(toDateString(parseDailyBound(date.toISOString())!));

  const returnModifier = (date: Date) =>
    returnDates.has(toDateString(parseDailyBound(date.toISOString())!));

  const today = dateToLabel(new Date());
  const pastModifier = (d: Date) => dateToLabel(d) < today;

  return (
    <div className="flex flex-col gap-4">
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
              // dots container — shown via CSS on days with modifiers
              "[&.has-pickup]:after:bg-primary [&.has-pickup]:after:absolute [&.has-pickup]:after:bottom-1 [&.has-pickup]:after:left-1/2 [&.has-pickup]:after:-translate-x-1/2 [&.has-pickup]:after:h-1 [&.has-pickup]:after:w-1 [&.has-pickup]:after:rounded-full",
              "[&.has-return]:before:bg-emerald-500 [&.has-return]:before:absolute [&.has-return]:before:bottom-1 [&.has-return]:before:left-[calc(50%+4px)] [&.has-return]:before:h-1 [&.has-return]:before:w-1 [&.has-return]:before:rounded-full",
              // past days: dim both dots by reducing their opacity
              "[&.is-past.has-pickup]:after:opacity-35",
              "[&.is-past.has-return]:before:opacity-35",
            ),
          }}
          disabled={isPending}
        />
      </div>

      {/* Dots legend */}
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
