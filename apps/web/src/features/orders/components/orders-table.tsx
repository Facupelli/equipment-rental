import type { OrderListDateLens } from "@repo/schemas";
import {
	flexRender,
	getCoreRowModel,
	type PaginationState,
	type Table as TanStackTable,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import type { ParsedOrderListItem } from "@/features/orders/orders.queries";
import {
	getEffectiveOrdersSort,
	type OrdersListSearch,
} from "@/features/orders/orders-list.search";
import { createOrdersColumns } from "./orders-columns";

interface OrdersTableProps {
	orders: ParsedOrderListItem[];
	meta?: {
		total: number;
		totalPages: number;
	};
	search: OrdersListSearch;
	isLoading: boolean;
	isError: boolean;
	onPageChange: (page: number) => void;
	onSortChange: (
		sortBy: "createdAt" | "pickupDate" | "returnDate",
		nextDirection?: "asc" | "desc",
	) => void;
	onRowClick: (order: ParsedOrderListItem) => void;
}

export function OrdersTable({
	orders,
	meta,
	search,
	isLoading,
	isError,
	onPageChange,
	onSortChange,
	onRowClick,
}: OrdersTableProps) {
	const currentSort = getEffectiveOrdersSort(search);
	const columns = createOrdersColumns({
		currentSort,
		dateLens: search.dateLens as OrderListDateLens | undefined,
		onSortChange,
	});

	const table = useReactTable({
		data: orders,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		manualSorting: true,
		manualFiltering: true,
		rowCount: meta?.total ?? 0,
		pageCount: meta?.totalPages ?? -1,
		state: {
			pagination: {
				pageIndex: search.page - 1,
				pageSize: search.limit,
			},
			sorting: [
				{ id: currentSort.sortBy, desc: currentSort.sortDirection === "desc" },
			],
		},
		onPaginationChange: (updater) => {
			const current: PaginationState = {
				pageIndex: search.page - 1,
				pageSize: search.limit,
			};
			const next = typeof updater === "function" ? updater(current) : updater;
			onPageChange(next.pageIndex + 1);
		},
	});

	return (
		<div className="space-y-2">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const align = (
										header.column.columnDef.meta as
											| { align?: string }
											| undefined
									)?.align;

									return (
										<TableHead
											key={header.id}
											className={align === "right" ? "text-right" : undefined}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>

					<TableBody>
						<TableBodyContent
							table={table}
							isLoading={isLoading}
							isError={isError}
							pageLimit={search.limit}
							onRowClick={onRowClick}
						/>
					</TableBody>
				</Table>
			</div>

			<PaginationFooter
				page={search.page}
				totalPages={meta?.totalPages ?? 1}
				total={meta?.total ?? 0}
				canPrevious={table.getCanPreviousPage()}
				canNext={table.getCanNextPage()}
				onPrevious={() => table.previousPage()}
				onNext={() => table.nextPage()}
			/>
		</div>
	);
}

function TableBodyContent({
	table,
	isLoading,
	isError,
	pageLimit,
	onRowClick,
}: {
	table: TanStackTable<ParsedOrderListItem>;
	isLoading: boolean;
	isError: boolean;
	pageLimit: number;
	onRowClick: (order: ParsedOrderListItem) => void;
}) {
	const colSpan = table.getAllColumns().length;

	if (isLoading) {
		return <SkeletonRows columns={colSpan} rows={pageLimit} />;
	}

	if (isError) {
		return (
			<TableRow>
				<TableCell
					colSpan={colSpan}
					className="h-32 text-center text-muted-foreground"
				>
					No pudimos cargar los pedidos.
				</TableCell>
			</TableRow>
		);
	}

	if (table.getRowModel().rows.length === 0) {
		return (
			<TableRow>
				<TableCell
					colSpan={colSpan}
					className="h-32 text-center text-muted-foreground"
				>
					No hay pedidos para los filtros seleccionados.
				</TableCell>
			</TableRow>
		);
	}

	return table.getRowModel().rows.map((row) => (
		<TableRow
			key={row.id}
			className="cursor-pointer"
			onClick={() => onRowClick(row.original)}
		>
			{row.getVisibleCells().map((cell) => {
				const align = (
					cell.column.columnDef.meta as { align?: string } | undefined
				)?.align;

				return (
					<TableCell
						key={cell.id}
						className={align === "right" ? "text-right" : undefined}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				);
			})}
		</TableRow>
	));
}

function SkeletonRows({ columns, rows }: { columns: number; rows: number }) {
	const skeletonCount = Math.min(rows, 10);

	return (
		<>
			{Array.from({ length: skeletonCount }).map((_, i) => (
				// biome-ignore lint: fine to use key here
				<TableRow key={i}>
					{Array.from({ length: columns }).map((_, j) => (
						// biome-ignore lint: fine to use key here
						<TableCell key={j}>
							<Skeleton className="h-4 w-full" />
						</TableCell>
					))}
				</TableRow>
			))}
		</>
	);
}

function PaginationFooter({
	page,
	totalPages,
	total,
	canPrevious,
	canNext,
	onPrevious,
	onNext,
}: {
	page: number;
	totalPages: number;
	total: number;
	canPrevious: boolean;
	canNext: boolean;
	onPrevious: () => void;
	onNext: () => void;
}) {
	return (
		<div className="flex items-center justify-between px-1 py-2">
			<p className="text-sm text-muted-foreground">
				{total} pedido{total !== 1 ? "s" : ""} total
			</p>

			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground tabular-nums">
					Página {page} de {totalPages}
				</span>
				<Button
					variant="outline"
					size="icon"
					onClick={onPrevious}
					disabled={!canPrevious}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={onNext}
					disabled={!canNext}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
