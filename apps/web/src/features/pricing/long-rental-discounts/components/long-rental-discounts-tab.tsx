import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLongRentalDiscountsTab } from "../hooks/use-long-rental-discounts-tab";
import { LongRentalDiscountsTable } from "./long-rental-discounts-table";

const TABLE_SKELETON_KEYS = [
	"long-rental-discount-skeleton-1",
	"long-rental-discount-skeleton-2",
	"long-rental-discount-skeleton-3",
	"long-rental-discount-skeleton-4",
	"long-rental-discount-skeleton-5",
] as const;

export function LongRentalDiscountsTab() {
	const { inputValue, setInputValue, query, page, handlePageChange } =
		useLongRentalDiscountsTab();

	return (
		<div className="space-y-4">
			<div className="relative max-w-sm">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder="Buscar descuentos por alquiler largo..."
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
				/>
			</div>

			<div className="rounded-lg border bg-card">
				<div className="flex items-center justify-between border-b px-5 py-4">
					<div>
						<span className="font-semibold text-sm">
							Descuentos por alquiler largo
						</span>
						<p className="mt-1 text-xs text-muted-foreground">
							Se aplican automáticamente salvo exclusión.
						</p>
					</div>
				</div>

				<div className="px-2">
					{query.isLoading ? (
						<TableSkeleton />
					) : query.isError ? (
						<p className="py-10 text-center text-sm text-destructive">
							No se pudieron cargar los descuentos por alquiler largo.
						</p>
					) : query.data?.data.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							No se encontraron descuentos por alquiler largo.
						</p>
					) : (
						<LongRentalDiscountsTable discounts={query.data?.data ?? []} />
					)}
				</div>

				{query.data && query.data.meta.total > 0 && (
					<div className="border-t px-4">
						<PaginationFooter
							page={page}
							total={query.data.meta.total}
							limit={10}
							onPageChange={handlePageChange}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

function TableSkeleton() {
	return (
		<div className="space-y-3 px-1 pt-2">
			{TABLE_SKELETON_KEYS.map((key) => (
				<Skeleton key={key} className="h-12 w-full rounded-md" />
			))}
		</div>
	);
}

interface PaginationFooterProps {
	page: number;
	total: number;
	limit: number;
	onPageChange: (page: number) => void;
}

function PaginationFooter({
	page,
	total,
	limit,
	onPageChange,
}: PaginationFooterProps) {
	const totalPages = Math.ceil(total / limit);
	const showing = Math.min(page * limit, total);

	return (
		<div className="flex items-center justify-between px-1 pb-1 pt-4">
			<span className="text-sm text-muted-foreground">
				Mostrando {showing} de {total} descuentos
			</span>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
				>
					Anterior
				</Button>
				<Button
					variant="default"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
				>
					Siguiente
				</Button>
			</div>
		</div>
	);
}
