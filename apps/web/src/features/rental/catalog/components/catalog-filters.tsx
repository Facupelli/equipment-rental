import { es } from "date-fns/locale";
import { CalendarIcon, SlidersHorizontal } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRentalCategories } from "@/features/rental/catalog/categories.queries";
import { useRentalLocationSchedules } from "@/features/tenant/locations/location-schedules.queries";
import { useRentalLocations } from "@/features/tenant/locations/locations.queries";
import dayjs from "@/lib/dates/dayjs";
import { cn } from "@/lib/utils";
import { ScheduleSlotType } from "@repo/types";
import type { LocationScheduleResponseDto } from "@repo/schemas";
import type { RentalPageSearch } from "../hooks/use-catalog-page-search";

interface RentalFiltersProps {
  search: RentalPageSearch;
  onLocationChange: (value: string) => void;
  setUrlParam: (patch: Partial<RentalPageSearch>) => void;
  onCategorySelect: (id: string) => void;
}

export function RentalFilters({
  search,
  onLocationChange,
  setUrlParam,
  onCategorySelect,
}: RentalFiltersProps) {
  const { data: locations } = useRentalLocations();

  const activeFilterCount = [search.categoryId].filter(Boolean).length;

  return (
    <div className="pt-6">
      <div className="hidden md:block">
        <div className="dark rounded-2xl bg-background p-4">
          <div className="flex flex-wrap items-end gap-6">
            {/* Location */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Ubicación del rental
              </p>
              <Select
                value={search.locationId}
                onValueChange={(value: string | null) => {
                  if (value) onLocationChange(value);
                }}
                items={locations?.map((location) => ({
                  label: location.name,
                  value: location.id,
                }))}
              >
                <SelectTrigger className="h-10! w-72 rounded-xl border-border bg-muted! hover:bg-muted/80! text-foreground">
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                Periodo de alquiler
              </p>
              <DateRangePicker
                locationId={search.locationId}
                startDate={search.startDate}
                endDate={search.endDate}
                onChange={(range) =>
                  setUrlParam({ startDate: range?.from, endDate: range?.to })
                }
                numberOfMonths={2}
                buttonClassName="h-10 w-fit rounded-xl border border-border bg-muted px-8 hover:bg-muted/80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:hidden">
        <Select
          value={search.locationId}
          onValueChange={(value: string | null) => {
            if (value) {
              onLocationChange(value);
            }
          }}
          items={locations?.map((location) => ({
            label: location.name,
            value: location.id,
          }))}
        >
          <SelectTrigger className="h-11 min-w-0 flex-1">
            <SelectValue placeholder="Seleccionar ubicacion" />
          </SelectTrigger>
          <SelectContent>
            {locations?.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ── Filters sheet button — mobile only ── */}
        <div className="ml-auto md:hidden">
          <FiltersSheet
            search={search}
            setUrlParam={setUrlParam}
            onCategorySelect={onCategorySelect}
            activeFilterCount={activeFilterCount}
          />
        </div>
      </div>
    </div>
  );
}

interface FiltersSheetProps {
  search: RentalPageSearch;
  setUrlParam: (patch: Partial<RentalPageSearch>) => void;
  onCategorySelect: (id: string) => void;
  activeFilterCount: number;
}

function FiltersSheet({
  search,
  setUrlParam,
  onCategorySelect,
  activeFilterCount,
}: FiltersSheetProps) {
  const { data: categories } = useRentalCategories();

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="relative gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        }
      />

      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85svh] overflow-y-auto border-neutral-700 bg-neutral-900 text-neutral-50"
      >
        <SheetHeader>
          <SheetTitle className="text-neutral-50">Filtros</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-neutral-300">
              PERIODO DE ALQUILER
            </p>
            <DateRangePicker
              locationId={search.locationId}
              startDate={search.startDate}
              endDate={search.endDate}
              onChange={(range) =>
                setUrlParam({ startDate: range?.from, endDate: range?.to })
              }
              numberOfMonths={1}
              buttonClassName="w-full justify-start bg-white/6 px-4 py-3 hover:bg-white/10"
              datesButtonClassName="text-neutral-400"
            />
          </div>

          {categories && categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-neutral-300">
                CATEGORIA
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      search.categoryId === cat.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => onCategorySelect(cat.id)}
                    className={cn(
                      "rounded-full",
                      search.categoryId !== cat.id &&
                        "border-neutral-700 bg-transparent text-neutral-50 hover:bg-white/10 hover:text-neutral-50",
                    )}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface DateRangePickerProps {
  locationId?: string;
  startDate?: Date;
  endDate?: Date;
  onChange: (range: DateRange | undefined) => void;
  numberOfMonths?: number;
  buttonClassName?: string;
  chipClassName?: string;
  iconClassName?: string;
  separatorClassName?: string;
  datesButtonClassName?: string;
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
  numberOfMonths = 2,
  buttonClassName,
  datesButtonClassName,
  locationId,
}: Pick<
  DateRangePickerProps,
  | "startDate"
  | "endDate"
  | "locationId"
  | "onChange"
  | "numberOfMonths"
  | "buttonClassName"
  | "datesButtonClassName"
>) {
  const value = { from: startDate, to: endDate };
  const { data: schedules } = useRentalLocationSchedules(locationId ?? "", {
    enabled: Boolean(locationId),
  });
  const boundaryType =
    value.from && !value.to ? ScheduleSlotType.RETURN : ScheduleSlotType.PICKUP;

  const fromLabel = value.from
    ? dayjs(value.from).format("DD MMM YYYY")
    : "Seleccionar";

  const toLabel = value.to
    ? dayjs(value.to).format("DD MMM YYYY")
    : "Seleccionar";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              "gap-0 hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
              buttonClassName,
            )}
          >
            {value.from && value.to ? (
              <>
                <div
                  className={cn(
                    "flex items-center gap-2 text-foreground",
                    datesButtonClassName,
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium tabular-nums">
                    {fromLabel}
                  </span>
                </div>
                <span className="mx-3 text-muted-foreground text-sm">→</span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums text-foreground",
                    datesButtonClassName,
                  )}
                >
                  {toLabel}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums text-foreground",
                    datesButtonClassName,
                  )}
                >
                  Selecciona el periodo de alquiler
                </span>
              </div>
            )}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          locale={es}
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
          disabled={(date) =>
            isScheduleBoundaryDisabled(date, boundaryType, schedules)
          }
        />
      </PopoverContent>
    </Popover>
  );
}

function isScheduleBoundaryDisabled(
  date: Date,
  type: ScheduleSlotType,
  schedules?: LocationScheduleResponseDto[],
): boolean {
  if (!schedules || schedules.length === 0) {
    return false;
  }

  const typedSchedules = schedules.filter((schedule) => schedule.type === type);
  const overrideSchedules = typedSchedules.filter((schedule) => {
    if (!schedule.specificDate) {
      return false;
    }

    return isSameCalendarDay(schedule.specificDate, date);
  });

  if (overrideSchedules.length > 0) {
    return false;
  }

  return !typedSchedules.some(
    (schedule) => schedule.dayOfWeek === date.getDay(),
  );
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
