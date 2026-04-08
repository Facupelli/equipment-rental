import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import type {
	AssetResponse,
	GetAssetsQuery,
	PaginationMeta,
} from "@repo/schemas";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AssetsToolbar } from "./assets-toolbar";

interface InventoryItemsTableProps {
	data: AssetResponse[];
	meta: PaginationMeta | undefined;
	columns: ColumnDef<AssetResponse>[];
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
			{Array.from({ length: rows }).map((_, i) => (
				<TableRow key={i}>
					{Array.from({ length: cols }).map((_, j) => (
						<TableCell key={j}>
							<Skeleton className="h-4 w-full" />
						</TableCell>
					))}
				</TableRow>
			))}
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
	const table = useReactTable({
		data,
		columns,
		state: { pagination },
		pageCount: meta?.totalPages ?? -1,
		manualPagination: true,
		manualFiltering: true,
		onPaginationChange,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className="space-y-4">
			<AssetsToolbar filters={filters} onFiltersChange={onFiltersChange} />

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
								<TableRow key={row.id}>
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
		</div>
	);
}
