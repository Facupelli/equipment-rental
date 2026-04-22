import type { OrderListDateLens } from "@repo/schemas";
import { OrderStatus } from "@repo/types";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	onStatusChange: (status?: OrdersListSearch["status"]) => void;
	onLocationChange: (locationId?: string) => void;
	onOrderNumberSubmit: (orderNumber?: number) => void;
	onReset: () => void;
}

export function OrdersToolbar({
	search,
	hasActiveFilters,
	onDateLensChange,
	onStatusChange,
	onLocationChange,
	onOrderNumberSubmit,
	onReset,
}: OrdersToolbarProps) {
	const { data: locations = [] } = useLocations();

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

			<Select
				value={search.status ?? ALL_VALUE}
				onValueChange={(value) =>
					onStatusChange(
						value === ALL_VALUE ? undefined : (value as OrderStatus),
					)
				}
				items={[
					{ value: ALL_VALUE, label: "Todos los estados" },
					...Object.values(OrderStatus).map((status) => ({
						value: status,
						label: ORDER_STATUS_MAP[status].label,
					})),
				]}
			>
				<SelectTrigger className="h-9 w-full sm:w-44">
					<SelectValue placeholder="Estado" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL_VALUE}>Todos los estados</SelectItem>
					{Object.values(OrderStatus).map((status) => (
						<SelectItem key={status} value={status}>
							{ORDER_STATUS_MAP[status].label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

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
