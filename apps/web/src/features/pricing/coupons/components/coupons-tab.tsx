import type { CouponView } from "@repo/schemas";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCouponsTab } from "../hooks/use-coupons-tab";
import { CouponsTable } from "./coupons-table";
import { DeleteCouponAlertDialog } from "./delete-coupon-alert-dialog";

const TABLE_SKELETON_KEYS = [
	"coupon-skeleton-1",
	"coupon-skeleton-2",
	"coupon-skeleton-3",
	"coupon-skeleton-4",
	"coupon-skeleton-5",
] as const;

export function CouponsTab() {
	const [deletingCoupon, setDeletingCoupon] = useState<CouponView | null>(null);
	const { inputValue, setInputValue, query, page, handlePageChange } =
		useCouponsTab();

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative max-w-sm">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					className="pl-9"
					placeholder="Buscar cupones..."
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
				/>
			</div>

			{/* Table */}
			<div className="rounded-lg border bg-card">
				<div className="flex items-center justify-between px-5 py-4 border-b">
					<span className="font-semibold text-sm">Listado de Cupones</span>
				</div>

				<div className="px-2">
					{query.isLoading ? (
						<TableSkeleton />
					) : query.isError ? (
						<p className="py-10 text-center text-sm text-destructive">
							Error al cargar los cupones.
						</p>
					) : query.data?.data.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							No se encontraron cupones.
						</p>
					) : (
						<CouponsTable
							coupons={query.data?.data ?? []}
							onDelete={setDeletingCoupon}
						/>
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

				<DeleteCouponAlertDialog
					open={deletingCoupon !== null}
					onOpenChange={(open) => {
						if (!open) {
							setDeletingCoupon(null);
						}
					}}
					coupon={deletingCoupon}
				/>
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
		<div className="flex items-center justify-between px-1 pt-4 pb-1">
			<span className="text-sm text-muted-foreground">
				Mostrando {showing} de {total} cupones
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
