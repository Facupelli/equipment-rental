import type {
	AssetResponseDto,
	GetAssetsQuery,
	PaginationMeta,
} from "@repo/schemas";
import type {
	ColumnDef,
	PaginationState,
	RowSelectionState,
} from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { AssetsToolbar } from "./assets-toolbar";
import { BulkAssetAssignmentDialog } from "./bulk-asset-assignment-dialog";

interface InventoryItemsTableProps {
	data: AssetResponseDto[];
	meta: PaginationMeta | undefined;
	columns: ColumnDef<AssetResponseDto>[];
	pagination: PaginationState;
	onPaginationChange: React.Dispatch<React.SetStateAction<PaginationState>>;
	filters: GetAssetsQuery;
	onFiltersChange: (filters: GetAssetsQuery) => void;
	isFetching: boolean;
}

function TableSkeleton({
	rows = 8,
	cols = 5,
}: {
	rows?: number;
	cols?: number;
}) {
	return (
		<>
			{Array.from({ length: rows }, (_, rowIndex) => `row-${rowIndex}`).map(
				(rowKey) => (
					<TableRow key={rowKey}>
						{Array.from(
							{ length: cols },
							(_, cellIndex) => `${rowKey}-cell-${cellIndex}`,
						).map((cellKey) => (
							<TableCell key={cellKey}>
								<Skeleton className="h-4 w-full" />
							</TableCell>
						))}
					</TableRow>
				),
			)}
		</>
	);
}

export function AssetsTable({
	data,
	meta,
	columns,
	pagination,
	onPaginationChange,
	filters,
	onFiltersChange,
	isFetching,
}: InventoryItemsTableProps) {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [activeDialog, setActiveDialog] = useState<
		"blackout" | "maintenance" | null
	>(null);

	const selectedAssetIds = Object.entries(rowSelection)
		.filter(([, isSelected]) => Boolean(isSelected))
		.map(([assetId]) => assetId);

	const table = useReactTable({
		data,
		columns,
		state: { pagination, rowSelection },
		pageCount: meta?.totalPages ?? -1,
		manualPagination: true,
		manualFiltering: true,
		onPaginationChange,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row.id,
		enableRowSelection: true,
	});

	function handleSelectionChange(updater: (previous: string[]) => string[]) {
		setRowSelection((previous) => {
			const nextSelectedIds = updater(
				Object.entries(previous)
					.filter(([, isSelected]) => Boolean(isSelected))
					.map(([assetId]) => assetId),
			);

			return nextSelectedIds.reduce<RowSelectionState>((acc, assetId) => {
				acc[assetId] = true;
				return acc;
			}, {});
		});
	}

	function clearSelection() {
		setRowSelection({});
	}

	return (
		<div className="space-y-4">
			<AssetsToolbar filters={filters} onFiltersChange={onFiltersChange} />

			{selectedAssetIds.length > 0 ? (
				<div className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-sm text-muted-foreground">
						{selectedAssetIds.length} asset
						{selectedAssetIds.length === 1 ? "" : "s"} seleccionados.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button size="sm" onClick={() => setActiveDialog("blackout")}>
							Create blackout
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setActiveDialog("maintenance")}
						>
							Create maintenance
						</Button>
						<Button size="sm" variant="ghost" onClick={clearSelection}>
							Clear selection
						</Button>
					</div>
				</div>
			) : null}

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						{isFetching ? (
							<TableSkeleton cols={columns.length} />
						) : table.getRowModel().rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-32 text-center text-muted-foreground"
								>
									No items found.
								</TableCell>
							</TableRow>
						) : (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() ? "selected" : undefined}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between px-1">
				<p className="text-sm text-muted-foreground">
					{meta
						? `${meta.total} item${meta.total !== 1 ? "s" : ""} · Page ${meta.page} of ${meta.totalPages}`
						: null}
				</p>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage() || isFetching}
					>
						<ChevronLeft className="h-4 w-4" />
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage() || isFetching}
					>
						Next
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{activeDialog ? (
				<BulkAssetAssignmentDialog
					mode={activeDialog}
					open={activeDialog !== null}
					onOpenChange={(open) => {
						if (!open) {
							setActiveDialog(null);
						}
					}}
					selectedAssetIds={selectedAssetIds}
					onSelectionChange={handleSelectionChange}
					onSuccess={clearSelection}
				/>
			) : null}
		</div>
	);
}
