import { useLocationScheduleSlots } from "@/features/tenant/locations/location-schedules.queries";
import { ScheduleSlotType } from "@repo/types";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import { formatSlot } from "../cart.utils";
import { formatDateShort, formatRentalDuration } from "@/lib/dates/format";
import { useCartPageContext } from "../cart-page.context";

export function CartPagePeriod() {
  const {
    period,
    locationId,
    locationName,
    isTimesRequired,
    onPickupTimeChange,
    onReturnTimeChange,
    pickupTime,
    returnTime,
  } = useCartPageContext();

  const startDate = period.start;
  const endDate = period.end;

  if (!startDate || !endDate) {
    return (
      <div className="mb-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-black">
          Rental Period
        </p>
        <div className="flex items-center gap-3 rounded-none border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            No rental period selected — go back to set your dates before
            booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 divide-x divide-neutral-200 py-4">
        <div className="px-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Rental Period
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Calendar className="h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-sm font-semibold text-black">
              {formatDateShort(startDate)} — {formatDateShort(endDate)}
            </p>
          </div>
        </div>

        <TimeSelectCell
          label="Pickup Time"
          date={startDate.toDate()}
          locationId={locationId}
          type={ScheduleSlotType.PICKUP}
          value={pickupTime}
          onChange={onPickupTimeChange}
        />
        <TimeSelectCell
          label="Return Time"
          date={endDate.toDate()}
          locationId={locationId}
          type={ScheduleSlotType.RETURN}
          value={returnTime}
          onChange={onReturnTimeChange}
        />

        <div className="px-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Total Duration
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
            <p className="text-sm font-semibold text-black">
              {formatRentalDuration(startDate, endDate)}
            </p>
          </div>
        </div>

        <div className="px-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            Pickup Location
          </p>
          <div className="pt-1">
            {locationName ? (
              <p className="text-sm font-semibold text-black">{locationName}</p>
            ) : (
              <p className="text-sm text-neutral-300">Not selected</p>
            )}
          </div>
        </div>
      </div>

      {isTimesRequired && (
        <div className="flex items-center gap-3 border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Please select a pickup time and a return time before booking.
          </p>
        </div>
      )}
    </div>
  );
}

// TimeSelectCell is intentionally prop-driven — it's a generic reusable control
// with no knowledge of the cart feature. It must not consume CartPageContext.
type TimeSelectCellProps = {
  label: string;
  date: Date;
  locationId: string;
  type: ScheduleSlotType;
  value: number | undefined;
  onChange: (value: number) => void;
};

export function TimeSelectCell({
  label,
  date,
  locationId,
  type,
  value,
  onChange,
}: TimeSelectCellProps) {
  const { data: slots, isLoading } = useLocationScheduleSlots({
    date,
    type,
    locationId,
  });

  const isClosed = !isLoading && (!slots || slots.length === 0);

  return (
    <div className="px-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </p>
      {isClosed ? (
        <div className="mt-1 flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1">
          <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            Closed
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <Clock className="h-4 w-4 shrink-0 text-neutral-400" />
          <select
            disabled={isLoading}
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full bg-transparent text-sm font-semibold text-black focus:outline-none disabled:text-neutral-300"
          >
            <option value="" disabled>
              {isLoading ? "Loading…" : "Select time"}
            </option>
            {(slots ?? []).map((slot) => (
              <option key={slot} value={slot}>
                {formatSlot(slot)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
