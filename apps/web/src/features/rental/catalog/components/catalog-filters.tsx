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
import { Badge } from "@/components/ui/badge";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useCategories } from "@/features/catalog/product-categories/categories.queries";
import dayjs from "@/lib/dates/dayjs";
import { CalendarIcon, SlidersHorizontal } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { RentalPageSearch } from "../hooks/use-catalog-page-search";

interface RentalFiltersProps {
  search: RentalPageSearch;
  onLocationChange: (value: string | null) => void;
  setUrlParam: (patch: Partial<RentalPageSearch>) => void;
  onCategorySelect: (id: string) => void;
}

export function RentalFilters({
  search,
  onLocationChange,
  setUrlParam,
  onCategorySelect,
}: RentalFiltersProps) {
  const { data: locations } = useLocations();

  const activeFilterCount = [search.categoryId].filter(Boolean).length;

  return (
    <div className="pt-4 flex items-center gap-4 md:gap-20">
      {/* ── Location — always visible ── */}
      <div className="flex items-center gap-2 md:gap-4">
        <p className="hidden md:block text-sm font-semibold text-black/50">
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
          <SelectTrigger className="w-44 md:w-52">
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

      {/* ── Date range — desktop only, inline ── */}
      <div className="hidden md:flex items-center gap-4">
        <p className="text-sm font-semibold text-black/50">
          PERIODO DE ALQUILER
        </p>
        <DateRangePicker
          startDate={search.startDate}
          endDate={search.endDate}
          onChange={(range) =>
            setUrlParam({ startDate: range?.from, endDate: range?.to })
          }
          numberOfMonths={2}
        />
      </div>

      {/* ── Filters sheet button — mobile only ── */}
      <div className="md:hidden ml-auto">
        <FiltersSheet
          search={search}
          setUrlParam={setUrlParam}
          onCategorySelect={onCategorySelect}
          activeFilterCount={activeFilterCount}
        />
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
  const { data: categories } = useCategories();

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
        className="rounded-t-2xl max-h-[85svh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-black/50">
              PERIODO DE ALQUILER
            </p>
            <DateRangePicker
              startDate={search.startDate}
              endDate={search.endDate}
              onChange={(range) =>
                setUrlParam({ startDate: range?.from, endDate: range?.to })
              }
              numberOfMonths={1}
            />
          </div>

          {categories && categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-black/50">CATEGORÍA</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      search.categoryId === cat.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => onCategorySelect(cat.id)}
                    className="rounded-full"
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
  startDate?: Date;
  endDate?: Date;
  onChange: (range: DateRange | undefined) => void;
  numberOfMonths?: number;
}

function DateRangePicker({
  startDate,
  endDate,
  onChange,
  numberOfMonths = 2,
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
            <div className="flex items-center gap-2 rounded-xs bg-muted px-3 py-2">
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
          numberOfMonths={numberOfMonths}
        />
      </PopoverContent>
    </Popover>
  );
}
