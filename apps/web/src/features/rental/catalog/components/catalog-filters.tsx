import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import dayjs from "@/lib/dates/dayjs";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { RentalPageSearch } from "../hooks/use-catalog-page-search";

interface RentalFiltersProps {
  search: RentalPageSearch;
  onLocationChange: (value: string | null) => void;
  setUrlParam: (patch: Partial<RentalPageSearch>) => void;
}

export function RentalFilters({
  search,
  onLocationChange,
  setUrlParam,
}: RentalFiltersProps) {
  const { data: locations } = useLocations();

  return (
    <div className="pt-4 flex items-center gap-20">
      <div className="flex items-center gap-4">
        <p className="text-sm font-semibold text-black/50">
          UBICACIÓN DEL RENTAL
        </p>
        <Select
          value={search.locationId ?? "all"}
          onValueChange={(value) =>
            onLocationChange(value === "all" ? null : value)
          }
          items={locations?.map((location) => ({
            label: location.name,
            value: location.id,
          }))}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Seleccionar ubicación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {locations?.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-sm font-semibold text-black/50">
          PERIODO DE ALQUILER
        </p>
        <DateRangePicker
          startDate={search.startDate}
          endDate={search.endDate}
          onChange={(range) =>
            setUrlParam({ startDate: range?.from, endDate: range?.to })
          }
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DateRangePicker — co-located because it's only used by RentalFilters
// ─────────────────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (range: DateRange | undefined) => void;
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const value = { from: startDate, to: endDate };

  const fromLabel = value.from
    ? dayjs(value.from).format("DD/MM/YYYY")
    : "Seleccionar";

  const toLabel = value.to
    ? dayjs(value.to).format("DD/MM/YYYY")
    : "Seleccionar";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="h-auto px-0 py-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="ml-3 flex items-center gap-2 rounded-xs bg-muted px-3 py-2">
              <span className="text-sm font-medium tabular-nums">
                {fromLabel}
              </span>
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            <span className="mx-2 text-muted-foreground text-sm">→</span>

            <div className="flex items-center gap-2 rounded-xs bg-muted px-3 py-2">
              <span className="text-sm font-medium tabular-nums">
                {toLabel}
              </span>
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </Button>
        }
      />

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
