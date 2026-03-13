import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { LocationScheduleResponseDto } from "@repo/schemas";
import {
  getScheduleSlotDefaults,
  scheduleToFormValues,
  toAddScheduleDtos,
  type ScheduleSlotFormValues,
} from "../../locations/schemas/location-schedule-form.schema";
import { ScheduleSlotType } from "@repo/types";
import { ScheduleSlotForm } from "./schedule-slot-form";
import {
  useBulkCreateLocationSchedules,
  useUpdateLocationSchedule,
} from "../../locations/location-schedules.queries";

// ---------------------------------------------------------------------------
// Modal state discriminated union
// The parent controls this — it encodes intent (create vs edit) and enough
// context to derive the correct form defaults without passing raw data down.
// ---------------------------------------------------------------------------

export type ScheduleSlotModalState =
  | { open: false }
  | {
      open: true;
      mode: "create";
      slotType: ScheduleSlotType;
      /** Present for weekly-cycle additions; absent for override additions. */
      dayOfWeek?: number;
    }
  | {
      open: true;
      mode: "edit";
      schedule: LocationScheduleResponseDto;
    };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ScheduleSlotModalProps {
  state: ScheduleSlotModalState;
  locationId: string;
  onClose: () => void;
}

export function ScheduleSlotModal({
  state,
  locationId,
  onClose,
}: ScheduleSlotModalProps) {
  const bulkCreate = useBulkCreateLocationSchedules();
  const update = useUpdateLocationSchedule();

  const isPending = bulkCreate.isPending || update.isPending;

  const defaultValues: ScheduleSlotFormValues = (() => {
    if (!state.open) {
      return getScheduleSlotDefaults({ type: "PICKUP", mode: "weekly" });
    }
    if (state.mode === "edit") {
      return scheduleToFormValues(state.schedule);
    }
    return getScheduleSlotDefaults({
      type: state.slotType,
      mode: state.dayOfWeek !== undefined ? "weekly" : "specific",
      daysOfWeek: state.dayOfWeek !== undefined ? [state.dayOfWeek] : [],
    });
  })();

  const isEditMode = state.open && state.mode === "edit";
  const title = isEditMode ? "Edit Schedule Slot" : "Add Schedule Slot";

  async function handleSubmit(values: ScheduleSlotFormValues) {
    const dtos = toAddScheduleDtos(values);

    if (state.open && state.mode === "edit") {
      // Edit always produces exactly one DTO — the single record being updated
      await update.mutateAsync({
        locationId,
        scheduleId: state.schedule.id,
        dto: dtos[0],
      });
    } else {
      await bulkCreate.mutateAsync({ items: dtos, locationId });
    }

    onClose();
  }

  return (
    <Dialog open={state.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Define availability for this location.
          </DialogDescription>
        </DialogHeader>

        {state.open && (
          <ScheduleSlotForm
            key={
              isEditMode && state.open ? (state as any).schedule.id : "create"
            }
            defaultValues={defaultValues}
            isEditMode={isEditMode}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
