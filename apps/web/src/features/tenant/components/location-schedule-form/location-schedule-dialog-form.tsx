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
  toAddScheduleDto,
  type ScheduleSlotFormValues,
} from "../../locations/schemas/location-schedule-form.schema";
import { ScheduleSlotType } from "@repo/types";
import { ScheduleSlotForm } from "./schedule-slot-form";
import {
  useCreateLocationSchedule,
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ScheduleSlotModal({
  state,
  locationId,
  onClose,
}: ScheduleSlotModalProps) {
  const createMutation = useCreateLocationSchedule();
  const updateMutation = useUpdateLocationSchedule();

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Derive form defaults from modal state
  const defaultValues: ScheduleSlotFormValues = (() => {
    if (!state.open) {
      // Fallback — never rendered when closed, but TS needs a value
      return getScheduleSlotDefaults({
        type: ScheduleSlotType.PICKUP,
        mode: "weekly",
      });
    }
    if (state.mode === "edit") {
      return scheduleToFormValues(state.schedule);
    }
    return getScheduleSlotDefaults({
      type: state.slotType,
      mode: state.dayOfWeek !== undefined ? "weekly" : "specific",
      dayOfWeek: state.dayOfWeek,
    });
  })();

  const title = !state.open
    ? ""
    : state.mode === "edit"
      ? "Edit Schedule Slot"
      : "Add Schedule Slot";

  async function handleSubmit(values: ScheduleSlotFormValues) {
    const dto = toAddScheduleDto(values);

    if (state.open && state.mode === "edit") {
      await updateMutation.mutateAsync({
        scheduleId: state.schedule.id,
        dto,
        locationId,
      });
    } else {
      await createMutation.mutateAsync({ dto, locationId });
    }

    onClose();
  }

  return (
    <Dialog open={state.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Define availability for this location.
          </DialogDescription>
        </DialogHeader>

        {state.open && (
          <ScheduleSlotForm
            key={
              // Re-mount the form when the modal state changes so TanStack
              // Form picks up the new defaultValues cleanly.
              state.mode === "edit" ? state.schedule.id : "create"
            }
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
