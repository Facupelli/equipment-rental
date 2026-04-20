import type { PromotionView } from "@repo/schemas";
import { PromotionActivationType } from "@repo/types";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Route } from "@/routes/_admin/dashboard/promotions";
import { usePromotionsTab } from "../hooks/use-promotions-tab";
import { DeletePromotionAlertDialog } from "./delete-promotion-alert-dialog";
import { PromotionsTable } from "./promotions-table";

const TABLE_SKELETON_KEYS = [
	"promotion-skeleton-1",
	"promotion-skeleton-2",
	"promotion-skeleton-3",
	"promotion-skeleton-4",
	"promotion-skeleton-5",
] as const;

export function PromotionsTab() {
	const navigate = useNavigate({ from: Route.fullPath });
	const search = Route.useSearch();
	const [deletingPromotion, setDeletingPromotion] =
		useState<PromotionView | null>(null);
	const {
		inputValue,
		setInputValue,
		query,
		page,
		activationType,
		handleActivationTypeChange,
		handlePageChange,
	} = usePromotionsTab();

	function handleEdit(promotion: PromotionView) {
		navigate({
			to: "/dashboard/promotions/$promotionId/edit",
			params: { promotionId: promotion.id },
			search,
		});
	}

	return (
		<>
			<div className="space-y-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative max-w-sm flex-1">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							className="pl-9"
							placeholder="Buscar promociones..."
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
						/>
					</div>

					<Select
						value={activationType ?? "ALL"}
						onValueChange={(value) =>
							handleActivationTypeChange(
								value === "ALL"
									? undefined
									: (value as PromotionActivationType),
							)
						}
						items={
							[
								{ value: "ALL", label: "Todas las activaciones" },
								{
									value: PromotionActivationType.AUTOMATIC,
									label: "Automaticas",
								},
								{
									value: PromotionActivationType.COUPON,
									label: "Con cupon",
								},
							] as const
						}
					>
						<SelectTrigger className="w-full sm:w-52">
							<SelectValue placeholder="Todas las activaciones" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">Todas las activaciones</SelectItem>
							<SelectItem value={PromotionActivationType.AUTOMATIC}>
								Automaticas
							</SelectItem>
							<SelectItem value={PromotionActivationType.COUPON}>
								Con cupon
							</SelectItem>
						</SelectContent>
					</Select>
				</div>

			<div className="rounded-lg border bg-card">
				<div className="flex items-center justify-between border-b px-5 py-4">
					<div>
						<span className="font-semibold text-sm">Promociones</span>
						<p className="mt-1 text-xs text-muted-foreground">
							Descuentos comerciales, estacionales o específicos por cliente.
						</p>
					</div>
				</div>

				<div className="px-2">
					{query.isLoading ? (
						<TableSkeleton />
					) : query.isError ? (
						<p className="py-10 text-center text-sm text-destructive">
							No se pudieron cargar las promociones.
						</p>
					) : query.data?.data.length === 0 ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							No se encontraron promociones.
						</p>
					) : (
						<PromotionsTable
							promotions={query.data?.data ?? []}
							onEdit={handleEdit}
							onDelete={setDeletingPromotion}
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
			</div>

			</div>

			<DeletePromotionAlertDialog
				open={deletingPromotion !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeletingPromotion(null);
					}
				}}
				promotion={deletingPromotion}
			/>
		</>
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
				Mostrando {showing} de {total} promociones
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
