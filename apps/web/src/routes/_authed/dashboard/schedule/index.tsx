import { Card, CardContent } from "@/components/ui/card";
import { STATUS_MAP } from "@/features/orders/orders.constants";
import {
  useUpcomingSchedule,
  type ParsedOrderSummary,
  type ParsedScheduleEvent,
} from "@/features/orders/orders.queries";
import type { OrderStatus } from "@repo/types";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toDateParam } from "@/lib/dates/parse";
import { addDays } from "@/lib/dates/compute";
import { Badge } from "@/components/ui/badge";
import { formatDailyRange } from "@/lib/dates/format";
import dayjs from "@/lib/dates/dayjs";

export const Route = createFileRoute("/_authed/dashboard/schedule/")({
  component: OrdersPage,
});

function OrdersPage() {
  // TODO: add local (location) timezone to all "now" dates
  const now = dayjs();
  const from = dayjs().format("YYYY-MM-DD");
  const to = toDateParam(addDays(now, 7));

  const { data, isPending, error } = useUpcomingSchedule({
    locationId: "d6f36e40-1c0f-4008-9365-24c587eed343",
    from,
    to,
  });

  console.log({ data });

  if (isPending) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const todayEvents = data.events.filter((e) => e.eventDate.isSame(now, "day"));
  const pickups = todayEvents.filter((e) => e.eventType === "PICKUP");
  const returns = todayEvents.filter((e) => e.eventType === "RETURN");

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <div>
          <h1 className=" text-2xl font-normal text-gray-900">Orders</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 active:bg-gray-800">
          Create New Order
        </button>
      </header>

      <main className="space-y-10 overflow-y-auto p-6">
        <TodaySection pickups={pickups} returns={returns} />
        <ScheduleTimeline events={data.events} />
      </main>
    </>
  );
}

// ─── Today Section ─────────────────────────────────────────────────────────────

function TodaySection({
  pickups,
  returns,
}: {
  pickups: ParsedScheduleEvent[];
  returns: ParsedScheduleEvent[];
}) {
  const pickupCount = pickups.length;
  const returnCount = returns.length;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Today's Pick-Ups"
          count={pickupCount}
          icon={
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
              />
            </svg>
          }
        />
        <StatCard
          label="Today's Returns"
          count={returnCount}
          icon={
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
              />
            </svg>
          }
        />
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Scheduled Out */}
        <div>
          <SectionLabel>
            <span className="mr-1.5">↗</span> Scheduled Out Today
          </SectionLabel>
          {pickups.length === 0 ? (
            <EmptyState message="No pick-ups scheduled for today" />
          ) : (
            <div className="space-y-2.5">
              {pickups.map((event) => (
                <TodayBookingCard key={event.order.id} order={event.order} />
              ))}
            </div>
          )}
        </div>

        {/* Due Back */}
        <div>
          <SectionLabel>
            <span className="mr-1.5">↙</span> Due Back Today
          </SectionLabel>
          {returns.length === 0 ? (
            <EmptyState message="No returns scheduled for today" />
          ) : (
            <div className="space-y-2.5">
              {returns.map((event) => (
                <TodayReturnCard key={event.order.id} order={event.order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Today Booking Card ────────────────────────────────────────────────────────

function TodayBookingCard({ order }: { order: ParsedOrderSummary }) {
  return (
    <Card className="transition-all hover:border-gray-200 hover:shadow-md">
      <CardContent className="flex items-center justify-between px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {order.customer?.displayName}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={order.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function TodayReturnCard({ order }: { order: ParsedOrderSummary }) {
  return (
    <Card className="hover:shadow-md hover:border-gray-200">
      <CardContent className="flex items-center justify-between px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {order.customer?.displayName}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={order.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_MAP[status] ?? STATUS_MAP.ACTIVE;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
      {children}
    </h2>
  );
}

// -----------------------------------------------------------------------------

function StatCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </span>
        <span className="text-gray-300">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className=" text-4xl font-normal text-gray-900">
          {String(count).padStart(2, "0")}
        </span>
        <span className="text-xs text-gray-400">orders</span>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50">
      <p className="text-xs text-gray-400">{message}</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

function formatDateHeading(date: ParsedScheduleEvent["eventDate"]): string {
  const today = dayjs();
  const label = date.utc().format("MMM D");

  if (date.isSame(today, "day")) {
    return `Today, ${label}`;
  }
  if (date.isSame(today.add(1, "day"), "day")) {
    return `Tomorrow, ${label}`;
  }
  return `${date.utc().format(`ddd`)}, ${label}`;
}

function groupEventsByDate(
  events: ParsedScheduleEvent[],
): [string, ParsedScheduleEvent[]][] {
  const map = new Map<string, ParsedScheduleEvent[]>();

  for (const event of events) {
    const key = event.eventDate.format("YYYY-MM-DD");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(event);
  }

  // Map insertion order is chronological since events arrive sorted from the API.
  return Array.from(map.entries());
}

interface ScheduleTimelineProps {
  events: ParsedScheduleEvent[];
}

function ScheduleTimeline({ events }: ScheduleTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No orders scheduled
      </div>
    );
  }

  const groups = groupEventsByDate(events);

  return (
    <div className="flex flex-col divide-y divide-border">
      {groups.map(([dateKey, groupEvents]) => (
        <div key={dateKey} className="py-4">
          <DateGroup events={groupEvents} />
        </div>
      ))}
    </div>
  );
}

function DateGroup({ events }: { events: ParsedScheduleEvent[] }) {
  // Re-parse the key back to Dayjs only for the heading label.
  // The key is always "YYYY-MM-DD" — safe to use the first event's eventDate
  // since all events in the group share the same date.
  const heading = formatDateHeading(events[0].eventDate);

  return (
    <div className="flex gap-6">
      <div className="w-32 shrink-0 pt-3">
        <span className="text-sm font-semibold text-foreground">{heading}</span>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        {events.map((event) => (
          <ScheduleEventRow
            key={`${event.order.id}-${event.eventType}`}
            event={event}
          />
        ))}
      </div>
    </div>
  );
}

function ScheduleEventRow({ event }: { event: ParsedScheduleEvent }) {
  const { order, eventType } = event;
  const customerName = order.customer?.displayName ?? "No customer";
  const period = formatDailyRange(order.periodStart, order.periodEnd);

  return (
    <Link
      to="/dashboard/orders/$orderId"
      params={{ orderId: order.id }}
      preload={false}
    >
      <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/70 hover:bg-muted/90 transition-colors">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {customerName}
          </span>
          <span className="text-xs text-muted-foreground">{period}</span>
        </div>

        <Badge
          variant={eventType === "PICKUP" ? "default" : "secondary"}
          className={
            eventType === "PICKUP"
              ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0"
              : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-0"
          }
        >
          {eventType === "PICKUP" ? "Pick-up" : "Return"}
        </Badge>
      </div>
    </Link>
  );
}
