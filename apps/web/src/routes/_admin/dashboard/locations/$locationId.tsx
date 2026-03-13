import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { CloudUpload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatTimeRange,
  groupSchedulesByDay,
  type DayScheduleRow,
} from "@/features/tenant/locations/utils/location-schedule.utils";
import {
  ScheduleSlotModal,
  type ScheduleSlotModalState,
} from "@/features/tenant/components/location-schedule-form/location-schedule-dialog-form";
import type { LocationScheduleResponseDto } from "@repo/schemas";
import { ScheduleSlotType } from "@repo/types";
import dayjs from "@/lib/dates/dayjs";
import { cn } from "@/lib/utils";
import { useLocationSchedules } from "@/features/tenant/locations/location-schedules.queries";
import { useLocations } from "@/features/tenant/locations/locations.queries";

export const Route = createFileRoute("/_admin/dashboard/locations/$locationId")(
  {
    component: LocationDetailPage,
  },
);

function LocationDetailPage() {
  const { locationId } = useParams({
    from: "/_admin/dashboard/locations/$locationId",
  });

  const locationQuery = useLocations();
  const schedulesQuery = useLocationSchedules(locationId);

  const [modalState, setModalState] = useState<ScheduleSlotModalState>({
    open: false,
  });

  const closeModal = () => setModalState({ open: false });

  // Derive table rows and override list from the flat schedules array
  const { weeklyRows, overrides } = groupSchedulesByDay(
    schedulesQuery.data ?? [],
  );

  if (locationQuery.isLoading || schedulesQuery.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="grid grid-cols-[1fr_320px] gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const location = locationQuery.data?.find((l) => l.id === locationId);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {/* ----------------------------------------------------------------
            Header
        ----------------------------------------------------------------- */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {location?.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Location Schedule Management &amp; Operating Hours
            </p>
          </div>
        </div>

        {/* ----------------------------------------------------------------
            Two-column layout: schedule table + sidebar
        ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          {/* Weekly Cycle */}
          <WeeklyCycleTable
            rows={weeklyRows}
            onEdit={(schedule) =>
              setModalState({ open: true, mode: "edit", schedule })
            }
            onAdd={(dayOfWeek, type) =>
              setModalState({
                open: true,
                mode: "create",
                slotType: type,
                dayOfWeek,
              })
            }
          />

          {/* Date Overrides */}
          <DateOverridesPanel
            overrides={overrides}
            onManage={(schedule) =>
              setModalState({ open: true, mode: "edit", schedule })
            }
            onAdd={() =>
              setModalState({
                open: true,
                mode: "create",
                slotType: ScheduleSlotType.PICKUP,
                // No dayOfWeek → modal defaults to "specific" mode
              })
            }
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------
          Modal — rendered at page level so it sits above everything
      ------------------------------------------------------------------- */}
      <ScheduleSlotModal
        state={modalState}
        locationId={locationId}
        onClose={closeModal}
      />
    </div>
  );
}

interface DateOverridesPanelProps {
  overrides: LocationScheduleResponseDto[];
  onManage: (schedule: LocationScheduleResponseDto) => void;
  onAdd: () => void;
}

function DateOverridesPanel({
  overrides,
  onManage,
  onAdd,
}: DateOverridesPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="rounded-t-xl bg-foreground/90 px-5 py-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-background">
          Date Overrides
        </p>
        <p className="mt-0.5 text-xs text-background/60">
          Temporary operational adjustments
        </p>
      </div>

      {/* Override list */}
      <div className="space-y-2 p-4">
        {overrides.length === 0 && (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No overrides yet
          </p>
        )}
        {overrides.map((schedule) => (
          <OverrideCard
            key={schedule.id}
            schedule={schedule}
            onManage={onManage}
          />
        ))}
      </div>

      {/* Add new */}
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add New Override
        </button>
      </div>
    </div>
  );
}

interface OverrideCardProps {
  schedule: LocationScheduleResponseDto;
  onManage: (schedule: LocationScheduleResponseDto) => void;
}

function OverrideCard({ schedule, onManage }: OverrideCardProps) {
  const date = dayjs(schedule.specificDate!);

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-4">
      {/* Date stamp */}
      <div className="flex w-10 shrink-0 flex-col items-center rounded-md bg-muted px-2 py-1.5 text-center">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {date.format("MMM")}
        </span>
        <span className="text-lg font-bold leading-none text-foreground">
          {date.format("DD")}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">
          {schedule.type === "PICKUP" ? "Pickup Override" : "Return Override"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTimeRange(schedule.openTime, schedule.closeTime)}
        </p>
        <button
          type="button"
          onClick={() => onManage(schedule)}
          className="mt-1 text-xs font-medium text-foreground underline-offset-2 hover:underline"
        >
          Manage
        </button>
      </div>
    </div>
  );
}

interface WeeklyCycleTableProps {
  rows: DayScheduleRow[];
  onEdit: (schedule: LocationScheduleResponseDto) => void;
  onAdd: (dayOfWeek: number, type: ScheduleSlotType) => void;
}

export function WeeklyCycleTable({
  rows,
  onEdit,
  onAdd,
}: WeeklyCycleTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Weekly Cycle
      </h2>

      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="pb-3 pr-6 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Day
            </th>
            <th className="pb-3 pr-8 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Pickup Window
            </th>
            <th className="pb-3 pr-8 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Return Window
            </th>
            <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <DayRow
              key={row.dayOfWeek}
              row={row}
              onEdit={onEdit}
              onAdd={onAdd}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DayRowProps {
  row: DayScheduleRow;
  onEdit: (schedule: LocationScheduleResponseDto) => void;
  onAdd: (dayOfWeek: number, type: ScheduleSlotType) => void;
}

export function DayRow({ row, onEdit, onAdd }: DayRowProps) {
  const isClosed = row.pickup === null && row.return === null;

  return (
    <tr
      className={cn(
        "border-b border-border/50 transition-colors last:border-0",
        isClosed && "opacity-50",
      )}
    >
      {/* Day name */}
      <td className="py-4 pr-6 w-28">
        <span
          className={cn(
            "text-sm font-medium",
            isClosed ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {row.label}
        </span>
      </td>

      {/* Pickup window */}
      <td className="py-4 pr-8">
        <SlotCell
          schedule={row.pickup}
          label="Pickup"
          onEdit={onEdit}
          onAdd={() => onAdd(row.dayOfWeek, ScheduleSlotType.PICKUP)}
        />
      </td>

      {/* Return window */}
      <td className="py-4 pr-8">
        <SlotCell
          schedule={row.return}
          label="Return"
          onEdit={onEdit}
          onAdd={() => onAdd(row.dayOfWeek, ScheduleSlotType.RETURN)}
        />
      </td>

      {/* Status badge */}
      <td className="py-4 text-right">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            isClosed ? "text-muted-foreground" : "text-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              isClosed ? "bg-muted-foreground/40" : "bg-emerald-500",
            )}
          />
          {isClosed ? "Closed" : "Active"}
        </span>
      </td>
    </tr>
  );
}

interface SlotCellProps {
  schedule: LocationScheduleResponseDto | null;
  label: "Pickup" | "Return";
  onEdit: (schedule: LocationScheduleResponseDto) => void;
  onAdd: () => void;
}

export function SlotCell({ schedule, label, onEdit, onAdd }: SlotCellProps) {
  if (!schedule) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="group flex items-center gap-1.5 text-sm text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        aria-label={`Add ${label} window`}
      >
        <Plus className="size-3.5 transition-transform group-hover:scale-110" />
        <span className="text-xs">Add {label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onEdit(schedule)}
      className="group flex flex-col items-start gap-0.5 text-left transition-opacity hover:opacity-70"
      aria-label={`Edit ${label} window`}
    >
      <span className="text-sm font-medium tabular-nums">
        {formatTimeRange(schedule.openTime, schedule.closeTime)}
      </span>
      <span className="text-xs text-muted-foreground">
        {schedule.slotIntervalMinutes} min slots
      </span>
    </button>
  );
}
