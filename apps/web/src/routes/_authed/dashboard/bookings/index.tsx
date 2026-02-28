import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_MAP } from "@/features/bookings/bookings.constants";
import {
  useTodayOverview,
  useUpcomingSchedule,
} from "@/features/bookings/bookings.queries";
import type {
  BookingCard,
  ProductSummary,
  ReturnCard,
  UpcomingBooking,
  UpcomingDay,
} from "@repo/schemas";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/bookings/")({
  component: BookingsPage,
});

function BookingsPage() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <div>
          <h1 className="font-['DM_Serif_Display'] text-2xl font-normal text-gray-900">
            Bookings
          </h1>
          <p className="mt-0.5 text-xs text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 active:bg-gray-800">
          Create New Booking
        </button>
      </header>

      <main className="space-y-10 overflow-y-auto p-6">
        <TodaySection />
        <div className="border-t border-gray-100 pt-8">
          <UpcomingSection />
        </div>
      </main>
    </>
  );
}

function renderProductSummary(summary: ProductSummary): React.ReactNode {
  return (
    <>
      {summary.firstName}
      {summary.additionalCount > 0 && (
        <span className="ml-1 text-gray-400 font-normal">
          (+{summary.additionalCount} more)
        </span>
      )}
    </>
  );
}

function StatusBadge({
  status,
  isOverdue,
}: {
  status: string;
  isOverdue?: boolean;
}) {
  const config = isOverdue
    ? STATUS_MAP.OVERDUE
    : (STATUS_MAP[status] ?? STATUS_MAP.ACTIVE);
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

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <Skeleton className="h-2.5 w-24" />
      <div className="mt-3 flex items-end gap-2">
        <Skeleton className="h-8 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

function UpcomingRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function TodaySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2.5">
          <Skeleton className="h-2.5 w-32" />
          {[...Array(3)].map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-2.5">
          <Skeleton className="h-2.5 w-32" />
          {[...Array(3)].map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function UpcomingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-3 w-48" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-8">
          <div className="w-28 shrink-0 space-y-1.5 pt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2.5 w-14" />
          </div>
          <div className="flex-1 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-4 shadow-sm">
            {[...Array(2)].map((_, j) => (
              <UpcomingRowSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
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
        <span className="font-['DM_Serif_Display'] text-4xl font-normal text-gray-900">
          {String(count).padStart(2, "0")}
        </span>
        <span className="text-xs text-gray-400">bookings</span>
      </div>
    </div>
  );
}

// ─── Today Booking Card ────────────────────────────────────────────────────────

function TodayBookingCard({ booking }: { booking: BookingCard }) {
  return (
    <Card className="transition-all hover:border-gray-200 hover:shadow-md">
      <CardContent className="flex items-center justify-between px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {booking.customerName}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {renderProductSummary(booking.productSummary)}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 flex-col items-end gap-1.5">
          <span className="font-['DM_Serif_Display'] text-sm text-gray-700">
            {formatTime(booking.scheduledTime)}
          </span>
          <StatusBadge status={booking.status} />
        </div>
      </CardContent>
    </Card>
  );
}

function TodayReturnCard({ booking }: { booking: ReturnCard }) {
  return (
    <Card
      className={`transition-all hover:shadow-md ${
        booking.isOverdue
          ? "border-red-200 bg-red-50/30"
          : "hover:border-gray-200"
      }`}
    >
      <CardContent className="flex items-center justify-between px-4 py-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">
            {booking.customerName}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {renderProductSummary(booking.productSummary)}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`font-['DM_Serif_Display'] text-sm ${
              booking.isOverdue ? "text-red-600" : "text-gray-700"
            }`}
          >
            {formatTime(booking.scheduledReturnTime)}
          </span>
          <StatusBadge status={booking.status} isOverdue={booking.isOverdue} />
        </div>
      </CardContent>
    </Card>
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

// ─── Today Section ─────────────────────────────────────────────────────────────

function TodaySection() {
  const { data, isPending, isError } = useTodayOverview();

  if (isPending) return <TodaySkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        Failed to load today's overview. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Today's Pick-Ups"
          count={data.pickUpsCount}
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
          count={data.returnsCount}
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
          {data.scheduledOut.length === 0 ? (
            <EmptyState message="No pick-ups scheduled for today" />
          ) : (
            <div className="space-y-2.5">
              {data.scheduledOut.map((booking) => (
                <TodayBookingCard key={booking.bookingId} booking={booking} />
              ))}
            </div>
          )}
        </div>

        {/* Due Back */}
        <div>
          <SectionLabel>
            <span className="mr-1.5">↙</span> Due Back Today
          </SectionLabel>
          {data.dueBack.length === 0 ? (
            <EmptyState message="No returns scheduled for today" />
          ) : (
            <div className="space-y-2.5">
              {data.dueBack.map((booking) => (
                <TodayReturnCard key={booking.bookingId} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upcoming Row ──────────────────────────────────────────────────────────────

function UpcomingBookingRow({ booking }: { booking: UpcomingBooking }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900">
          {renderProductSummary(booking.productSummary)}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{booking.customerName}</p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        <StatusBadge status={booking.status} />
        <button className="text-xs font-medium text-gray-400 underline-offset-2 transition-colors hover:text-gray-700 hover:underline">
          View Details
        </button>
      </div>
    </div>
  );
}

// ─── Upcoming Day Group ────────────────────────────────────────────────────────

function UpcomingDayGroup({ day }: { day: UpcomingDay }) {
  const { label, sub } = formatUpcomingDate(day.date);

  return (
    <div className="flex gap-6 sm:gap-8">
      {/* Date label — fixed width column */}
      <div className="w-24 shrink-0 pt-3.5 sm:w-28">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
      </div>

      {/* Booking rows — left border acts as timeline spine */}
      <div className="flex-1 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-4 shadow-sm">
        {day.bookings.map((booking) => (
          <UpcomingBookingRow key={booking.bookingId} booking={booking} />
        ))}
      </div>
    </div>
  );
}

// ─── Upcoming Section ──────────────────────────────────────────────────────────

function UpcomingSection() {
  const { data, isPending, isError } = useUpcomingSchedule();

  if (isPending) return <UpcomingSkeleton />;

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        Failed to load upcoming schedule. Please refresh.
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Upcoming Schedule — Next 7 Days</SectionLabel>
      {data.days.length === 0 ? (
        <EmptyState message="No bookings scheduled in the next 7 days" />
      ) : (
        <div className="space-y-4">
          {data.days.map((day) => (
            <UpcomingDayGroup key={day.date} day={day} />
          ))}
        </div>
      )}
    </div>
  );
}
