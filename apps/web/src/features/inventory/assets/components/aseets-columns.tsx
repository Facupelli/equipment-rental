import type { AssetResponseDto } from "@repo/schemas";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ---------------------------------------------------------------------------
// Actions cell
// ---------------------------------------------------------------------------

interface ActionsProps {
	item: AssetResponseDto;
	onEdit: (item: AssetResponseDto) => void;
}

function ActionsCell({ item, onEdit }: ActionsProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon" className="h-8 w-8">
						<MoreHorizontal className="h-4 w-4" />
						<span className="sr-only">Open actions</span>
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				<DropdownMenuItem onClick={() => onEdit(item)}>
					<Pencil className="mr-2 h-4 w-4" />
					Edit
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnOptions {
	onEdit: (item: AssetResponseDto) => void;
}

export function getAssetSelectionColumn(): ColumnDef<AssetResponseDto> {
	return {
		id: "select",
		header: ({ table }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					indeterminate={table.getIsSomePageRowsSelected()}
					onCheckedChange={table.getToggleAllPageRowsSelectedHandler()}
					aria-label="Seleccionar assets de la pagina"
				/>
			</div>
		),
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={row.getToggleSelectedHandler()}
					disabled={!row.getCanSelect()}
					aria-label={`Seleccionar asset ${row.original.id}`}
				/>
			</div>
		),
		enableSorting: false,
		enableHiding: false,
	};
}

export function getAssetColumns({
	onEdit,
}: ColumnOptions): ColumnDef<AssetResponseDto>[] {
	return [
		{
			id: "serial",
			header: "Serial / ID",
			cell: ({ row }) => {
				const { serialNumber } = row.original;
				return (
					<span className="font-medium font-mono text-sm">
						{serialNumber ?? "—"}
					</span>
				);
			},
		},
		{
			id: "product",
			header: "Product",
			cell: ({ row }) => (
				<span className="font-medium">{row.original.productType.name}</span>
			),
		},
		{
			id: "location",
			header: "Location",
			cell: ({ row }) => row.original.location.name,
		},
		{
			id: "owner",
			header: "Owner",
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.owner?.name ?? "—"}
				</span>
			),
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => <ActionsCell item={row.original} onEdit={onEdit} />,
		},
	];
}
