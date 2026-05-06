import type { OrderListDateLens } from "@repo/schemas";
import { OrderStatus } from "@repo/types";
import { ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { ORDER_STATUS_MAP } from "@/features/orders/orders.constants";
import type { OrdersListSearch } from "@/features/orders/orders-list.search";
import { useLocations } from "@/features/tenant/locations/locations.queries";

const ALL_VALUE = "__ALL__";

const ORDER_STATUS_OPTIONS = Object.values(OrderStatus);

const OPERATIONALLY_ACTIVE_STATUSES = [
	OrderStatus.CONFIRMED,
	OrderStatus.ACTIVE,
];

const DATE_LENS_OPTIONS: Array<{ value: OrderListDateLens; label: string }> = [
	{ value: "TODAY", label: "Hoy" },
	{ value: "UPCOMING", label: "Próximos" },
	{ value: "ACTIVE", label: "Activos" },
	{ value: "PAST", label: "Pasados" },
];

interface OrdersToolbarProps {
	search: OrdersListSearch;
	hasActiveFilters: boolean;
	onDateLensChange: (dateLens?: OrderListDateLens) => void;
	onStatusesChange: (statuses?: OrdersListSearch["statuses"]) => void;
	onLocationChange: (locationId?: string) => void;
	onOrderNumberSubmit: (orderNumber?: number) => void;
	onReset: () => void;
}

export function OrdersToolbar({
	search,
	hasActiveFilters,
	onDateLensChange,
	onStatusesChange,
	onLocationChange,
	onOrderNumberSubmit,
	onReset,
}: OrdersToolbarProps) {
	const { data: locations = [] } = useLocations();
	const selectedStatuses = getSelectedStatuses(search);
	const effectiveStatuses =
		selectedStatuses.length > 0 ? selectedStatuses : ORDER_STATUS_OPTIONS;
	const statusLabel = getStatusFilterLabel(selectedStatuses);

	function changeStatuses(statuses?: OrderStatus[]) {
		onStatusesChange(normalizeStatusesFilter(statuses));
	}

	function toggleStatus(status: OrderStatus) {
		const next = effectiveStatuses.includes(status)
			? effectiveStatuses.filter((selected) => selected !== status)
			: [...effectiveStatuses, status];

		changeStatuses(next);
	}

	return (
		<div className="flex flex-wrap items-center gap-3">
			<form
				key={String(search.orderNumber ?? "")}
				onSubmit={(event) => {
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					const raw = String(formData.get("orderNumber") ?? "").trim();
					const parsed = raw === "" ? undefined : Number(raw);
					onOrderNumberSubmit(
						parsed === undefined || Number.isNaN(parsed) ? undefined : parsed,
					);
				}}
				className="flex w-full items-center gap-2 sm:w-auto"
			>
				<Input
					name="orderNumber"
					type="number"
					min={1}
					defaultValue={search.orderNumber ?? ""}
					placeholder="Buscar N° pedido exacto"
					className="h-9 w-full sm:w-56"
				/>
				<Button type="submit" variant="outline" size="sm" className="h-9 px-3">
					<Search className="mr-1.5 h-4 w-4" />
					Buscar
				</Button>
			</form>

			<Select
				value={search.dateLens ?? ALL_VALUE}
				onValueChange={(value) =>
					onDateLensChange(
						value === ALL_VALUE ? undefined : (value as OrderListDateLens),
					)
				}
				items={[
					{ value: ALL_VALUE, label: "Todas las fechas" },
					...DATE_LENS_OPTIONS.map((option) => ({
						value: option.value,
						label: option.label,
					})),
				]}
			>
				<SelectTrigger className="h-9 w-full sm:w-40">
					<SelectValue placeholder="Fecha" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_VALUE}>Todas las fechas</SelectItem>
					{DATE_LENS_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Popover>
				<PopoverTrigger
					render={
						<Button
							variant="outline"
							className="h-9 w-full justify-between font-normal sm:w-52"
						>
							<span className="truncate">{statusLabel}</span>
							<ChevronDown className="ml-2 size-4 opacity-50" />
						</Button>
					}
				/>
				<PopoverContent align="start" className="w-72 gap-3 p-3">
					<div className="grid grid-cols-2 gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => changeStatuses(undefined)}
						>
							Todos
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() =>
								changeStatuses(
									ORDER_STATUS_OPTIONS.filter(
										(status) => status !== OrderStatus.CANCELLED,
									),
								)
							}
						>
							Sin cancelados
						</Button>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="col-span-2"
							onClick={() => changeStatuses(OPERATIONALLY_ACTIVE_STATUSES)}
						>
							Operativamente activos
						</Button>
					</div>

					<div className="space-y-1 border-t pt-3">
						{ORDER_STATUS_OPTIONS.map((status) => {
							const optionId = `order-status-${status}`;

							return (
								<label
									key={status}
									htmlFor={optionId}
									className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
								>
									<Checkbox
										id={optionId}
										checked={effectiveStatuses.includes(status)}
										onCheckedChange={() => toggleStatus(status)}
									/>
									<span>{ORDER_STATUS_MAP[status].label}</span>
								</label>
							);
						})}
					</div>
				</PopoverContent>
			</Popover>

			<Select
				value={search.locationId ?? ALL_VALUE}
				onValueChange={(value) => {
					if (value) {
						onLocationChange(value === ALL_VALUE ? undefined : value);
					}
				}}
				items={[
					{
						value: ALL_VALUE,
						label: "Todas las ubicaciones",
					},
					...locations.map((location) => ({
						value: location.id,
						label: location.name,
					})),
				]}
			>
				<SelectTrigger className="h-9 w-full sm:w-52">
					<SelectValue placeholder="Ubicación" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_VALUE}>Todas las ubicaciones</SelectItem>
					{locations.map((location) => (
						<SelectItem key={location.id} value={location.id}>
							{location.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{hasActiveFilters ? (
				<Button
					variant="ghost"
					size="sm"
					onClick={onReset}
					className="h-9 px-2 text-muted-foreground"
				>
					<X className="mr-1 h-4 w-4" />
					Limpiar
				</Button>
			) : null}
		</div>
	);
}

function getSelectedStatuses(search: OrdersListSearch): OrderStatus[] {
	return search.statuses ?? [];
}

function normalizeStatusesFilter(statuses?: OrderStatus[]): OrderStatus[] | undefined {
	if (!statuses?.length || statuses.length === ORDER_STATUS_OPTIONS.length) {
		return undefined;
	}

	return ORDER_STATUS_OPTIONS.filter((status) => statuses.includes(status));
}

function getStatusFilterLabel(statuses: OrderStatus[]): string {
	if (statuses.length === 0) {
		return "Todos los estados";
	}

	if (statuses.length === 1) {
		const status = statuses[0];

		return status ? ORDER_STATUS_MAP[status].label : "Todos los estados";
	}

	return `${statuses.length} estados`;
}
