import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  scheduleSlotFormSchema,
  type ScheduleSlotFormValues,
} from "../../locations/schemas/location-schedule-form.schema";
import { ScheduleSlotType } from "@repo/types";
import {
  DAYS_OF_WEEK,
  SLOT_INTERVAL_OPTIONS,
} from "../../locations/constants/location-schedule.constants";

interface ScheduleSlotFormProps {
  defaultValues: ScheduleSlotFormValues;
  onSubmit: (values: ScheduleSlotFormValues) => Promise<void>;
  onCancel: () => void;
  isPending: boolean;
}

export function ScheduleSlotForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
}: ScheduleSlotFormProps) {
  const form = useForm({
    defaultValues,
    validators: { onSubmit: scheduleSlotFormSchema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-5"
    >
      <FieldGroup className="space-y-5">
        {/* ----------------------------------------------------------------
            Slot Type toggle — Pickup | Return
            Rendered as a segmented control rather than a Select because
            there are only two mutually exclusive options.
        ----------------------------------------------------------------- */}
        <form.Field name="type">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor="slot-type">Slot Type</FieldLabel>
                <div className="flex rounded-lg border border-border bg-muted p-1">
                  {Object.values(ScheduleSlotType).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.handleChange(type)}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                        field.state.value === type
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        {/* ----------------------------------------------------------------
            Mode toggle — Weekly recurrence | Specific date
            Switching mode does NOT clear the sibling field immediately;
            the DTO converter nulls the inactive branch on submission.
        ----------------------------------------------------------------- */}
        <form.Field name="mode">
          {(modeField) => (
            <>
              <Field>
                <FieldLabel>Applicable To</FieldLabel>
                <div className="flex rounded-lg border border-border bg-muted p-1">
                  {(
                    [
                      { value: "weekly", label: "Weekly recurrence" },
                      { value: "specific", label: "Specific date" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => modeField.handleChange(opt.value)}
                      className={cn(
                        "flex-1 rounded-md py-1.5 text-sm font-medium transition-all",
                        modeField.state.value === opt.value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Conditional sub-field based on mode */}
              {modeField.state.value === "weekly" ? (
                <form.Field name="dayOfWeek">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="day-of-week">
                          Day of Week
                        </FieldLabel>
                        <Select
                          name={field.name}
                          value={field.state.value?.toString() ?? ""}
                          onValueChange={(v) => field.handleChange(Number(v))}
                          items={DAYS_OF_WEEK}
                        >
                          <SelectTrigger
                            id="day-of-week"
                            aria-invalid={isInvalid}
                          >
                            <SelectValue placeholder="Select a day" />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS_OF_WEEK.map((d) => (
                              <SelectItem
                                key={d.value}
                                value={d.value.toString()}
                              >
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              ) : (
                <form.Field name="specificDate">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="specific-date">Date</FieldLabel>
                        <Input
                          id="specific-date"
                          type="date"
                          name={field.name}
                          value={field.state.value ?? ""}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(e.target.value || null)
                          }
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                </form.Field>
              )}
            </>
          )}
        </form.Field>

        {/* ----------------------------------------------------------------
            Open Time / Close Time — side by side
        ----------------------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="openTime">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="open-time">Open Time</FieldLabel>
                  <Input
                    id="open-time"
                    type="time"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="closeTime">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor="close-time">Close Time</FieldLabel>
                  <Input
                    id="close-time"
                    type="time"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </div>

        {/* ----------------------------------------------------------------
            Slot Interval — three-button toggle
        ----------------------------------------------------------------- */}
        <form.Field name="slotIntervalMinutes">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>Slot Interval</FieldLabel>
                <div className="flex gap-2">
                  {SLOT_INTERVAL_OPTIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => field.handleChange(mins)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm font-medium transition-all",
                        field.state.value === mins
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </FieldGroup>

      {/* ----------------------------------------------------------------
          Actions
      ----------------------------------------------------------------- */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Save Schedule Slot
        </Button>
      </div>
    </form>
  );
}
