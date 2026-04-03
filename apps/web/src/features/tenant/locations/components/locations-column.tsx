import type { LocationListItemResponse } from "@repo/schemas";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GetLocationColumnsOptions {
	onEdit: (location: LocationListItemResponse) => void;
	onDeactivate: (location: LocationListItemResponse) => void;
}

export function getLocationColumns({
	onEdit,
	onDeactivate,
}: GetLocationColumnsOptions): ColumnDef<LocationListItemResponse>[] {
	return [
		{
			accessorKey: "name",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="px-0 hover:bg-transparent"
				>
					Nombre
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
		},
		{
			accessorKey: "address",
			header: "Dirección",
			cell: ({ row }) => row.original.address || "Sin dirección",
		},
		{
			accessorKey: "isActive",
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="px-0 hover:bg-transparent"
				>
					Estado
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			),
			cell: ({ row }) =>
				row.getValue("isActive") ? (
					<Badge
						variant="outline"
						className="border-emerald-500 text-emerald-500"
					>
						Activa
					</Badge>
				) : (
					<Badge
						variant="outline"
						className="border-muted-foreground text-muted-foreground"
					>
						Inactiva
					</Badge>
				),
		},
		{
			id: "actions",
			header: "Acciones",
			cell: ({ row }) => (
				<LocationActions
					location={row.original}
					onEdit={onEdit}
					onDeactivate={onDeactivate}
				/>
			),
		},
	];
}

interface LocationActionsProps {
	location: LocationListItemResponse;
	onEdit: (location: LocationListItemResponse) => void;
	onDeactivate: (location: LocationListItemResponse) => void;
}

function LocationActions({
	location,
	onEdit,
	onDeactivate,
}: LocationActionsProps) {
	function stopPropagation(event: { stopPropagation: () => void }) {
		event.stopPropagation();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label="Abrir acciones de la ubicación"
						onClick={stopPropagation}
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent
				align="end"
				className="w-44"
				onClick={stopPropagation}
			>
				<DropdownMenuItem onClick={() => onEdit(location)}>
					<Pencil className="h-4 w-4" />
					Editar
				</DropdownMenuItem>
				<DropdownMenuItem
					variant="destructive"
					onClick={() => onDeactivate(location)}
					disabled={!location.isActive}
				>
					<Power className="h-4 w-4" />
					Desactivar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
