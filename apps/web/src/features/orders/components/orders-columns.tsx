import type { OrderListDateLens, OrderListSortBy } from "@repo/schemas";
import { FulfillmentMethod } from "@repo/types";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/features/orders/components/order-status-badge";
import { formatOrderNumber } from "@/features/orders/order.utils";
import type { ParsedOrderListItem } from "@/features/orders/orders.queries";

type OrdersSortState = {
	sortBy: OrderListSortBy;
	sortDirection: "asc" | "desc";
};

type CreateOrderColumnsOptions = {
	currentSort: OrdersSortState;
	dateLens?: OrderListDateLens;
	onSortChange: (
		sortBy: OrderListSortBy,
		nextDirection?: "asc" | "desc",
	) => void;
};

export function createOrdersColumns({
	currentSort,
	dateLens,
	onSortChange,
}: CreateOrderColumnsOptions): ColumnDef<ParsedOrderListItem>[] {
	return [
		{
			accessorKey: "number",
			header: "Pedido",
			cell: ({ row }) => (
				<div className="space-y-1">
					<p className="font-medium text-foreground">
						#{formatOrderNumber(row.original.number)}
					</p>
					<p className="text-xs text-muted-foreground font-mono">
						{row.original.id}
					</p>
				</div>
			),
		},
		{
			accessorKey: "status",
			header: "Estado",
			cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
		},
		{
			accessorKey: "fulfillmentMethod",
			header: "Entrega",
			cell: ({ row }) => (
				<span className="text-sm text-foreground">
					{row.original.fulfillmentMethod === FulfillmentMethod.DELIVERY
						? "Delivery"
						: "Retiro"}
				</span>
			),
		},
		{
			id: "customer",
			header: "Cliente",
			cell: ({ row }) => {
				const customer = row.original.customer;

				if (!customer) {
					return (
						<span className="text-sm text-muted-foreground">Sin cliente</span>
					);
				}

				return (
					<div className="flex items-center gap-2">
						<Badge variant="outline" className="gap-1 rounded-full px-2 py-0.5">
							{customer.isCompany ? (
								<Building2 className="h-3 w-3" />
							) : (
								<User className="h-3 w-3" />
							)}
							{customer.isCompany ? "Empresa" : "Persona"}
						</Badge>
						<span className="text-sm text-foreground">
							{customer.displayName}
						</span>
					</div>
				);
			},
		},
		{
			id: "location",
			header: "Ubicación",
			cell: ({ row }) => (
				<span className="text-sm text-foreground">
					{row.original.location.name}
				</span>
			),
		},
		{
			accessorKey: "createdAt",
			id: "createdAt",
			header: () => (
				<SortableHeader
					label="Creado"
					sortBy="createdAt"
					currentSort={currentSort}
					onSortChange={onSortChange}
				/>
			),
			cell: ({ row }) => row.original.createdAt.format("MMM D, YYYY"),
			meta: { align: "right" },
		},
		{
			accessorKey: "pickupAt",
			id: "pickupDate",
			header: () => (
				<SortableHeader
					label={dateLens === "UPCOMING" ? "Retiro" : "Retira"}
					sortBy="pickupDate"
					currentSort={currentSort}
					onSortChange={onSortChange}
				/>
			),
			cell: ({ row }) => formatTimestamp(row.original.pickupAt),
			meta: { align: "right" },
		},
		{
			accessorKey: "returnAt",
			id: "returnDate",
			header: () => (
				<SortableHeader
					label={dateLens === "PAST" ? "Devuelto" : "Devuelve"}
					sortBy="returnDate"
					currentSort={currentSort}
					onSortChange={onSortChange}
				/>
			),
			cell: ({ row }) => formatTimestamp(row.original.returnAt),
			meta: { align: "right" },
		},
	];
}

function SortableHeader({
	label,
	sortBy,
	currentSort,
	onSortChange,
}: {
	label: string;
	sortBy: OrderListSortBy;
	currentSort: OrdersSortState;
	onSortChange: (
		sortBy: OrderListSortBy,
		nextDirection?: "asc" | "desc",
	) => void;
}) {
	const isActive = currentSort.sortBy === sortBy;
	const nextDirection = !isActive
		? getDefaultDirection(sortBy)
		: currentSort.sortDirection === "desc"
			? "asc"
			: undefined;

	return (
		<Button
			variant="ghost"
			size="sm"
			className="-ml-3 h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
			onClick={() => onSortChange(sortBy, nextDirection)}
		>
			{label}
			{isActive ? (
				currentSort.sortDirection === "desc" ? (
					<ArrowDown className="ml-1 h-3.5 w-3.5" />
				) : (
					<ArrowUp className="ml-1 h-3.5 w-3.5" />
				)
			) : (
				<ArrowUpDown className="ml-1 h-3.5 w-3.5" />
			)}
		</Button>
	);
}

function getDefaultDirection(sortBy: OrderListSortBy): "asc" | "desc" {
	return sortBy === "createdAt" ? "desc" : "asc";
}

function formatTimestamp(value: ParsedOrderListItem["createdAt"]): string {
	return `${value.format("MMM D, YYYY")} · ${value.format("HH:mm")}`;
}
