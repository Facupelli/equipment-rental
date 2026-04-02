import type { ProductCategoryResponse } from "@repo/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	categoryQueries,
	useCategories,
} from "@/features/catalog/product-categories/categories.queries";
import { CreateProductCategoryDialog } from "@/features/catalog/product-categories/components/create-product-category-dialog";
import { DeleteProductCategoryAlertDialog } from "@/features/catalog/product-categories/components/delete-product-category-alert-dialog";
import { EditProductCategoryDialog } from "@/features/catalog/product-categories/components/edit-product-category-dialog";
import { cn } from "@/lib/utils";
import { AdminRouteError } from "@/shared/components/admin-route-error";

export const Route = createFileRoute("/_admin/dashboard/catalog/categories/")({
	loader: ({ context: { queryClient } }) =>
		queryClient.ensureQueryData(categoryQueries.list()),
	errorComponent: ({ error }) => {
		return (
			<AdminRouteError
				error={error}
				genericMessage="No pudimos cargar el catalogo de categorías."
				forbiddenMessage="No tienes permisos para ver las categorías."
			/>
		);
	},
	component: CategoriesPage,
});

function CategoriesPage() {
	return (
		<div className="space-y-6 p-8">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
					<p className="text-sm text-muted-foreground">
						Maneja las categorías para organizar tus productos.
					</p>
				</div>

				<CreateProductCategoryDialog />
			</div>

			<CategoriesTable />
		</div>
	);
}

function CategoriesTable() {
	const { data: categories = [], isPending, isError } = useCategories();
	const [editingCategory, setEditingCategory] =
		useState<ProductCategoryResponse | null>(null);
	const [deletingCategory, setDeletingCategory] =
		useState<ProductCategoryResponse | null>(null);

	if (isError) {
		return (
			<p className="text-sm text-destructive">
				No se pudieron cargar las categorias. Intentalo de nuevo.
			</p>
		);
	}

	if (isPending) {
		return <p className="text-sm text-muted-foreground">Cargando...</p>;
	}

	if (categories.length === 0) {
		return <p className="text-sm text-muted-foreground">No hay categorias.</p>;
	}

	return (
		<>
			<div className="rounded-md border">
				<div className="grid grid-cols-[1fr_2fr_auto] items-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground border-b">
					<span>Nombre</span>
					<span>Descripcion</span>
					<span>Acciones</span>
				</div>

				{categories.map((category, index) => (
					<div
						key={category.id}
						className={cn(
							"grid grid-cols-[1fr_2fr_auto] items-start gap-4 px-4 py-5",
							index !== categories.length - 1 && "border-b",
						)}
					>
						<p className="font-medium">{category.name}</p>
						<p className="text-sm text-muted-foreground">
							{category.description ?? "-"}
						</p>
						<CategoryRowActions
							onEdit={() => setEditingCategory(category)}
							onDelete={() => setDeletingCategory(category)}
						/>
					</div>
				))}
			</div>

			<EditProductCategoryDialog
				open={editingCategory !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditingCategory(null);
					}
				}}
				category={editingCategory}
			/>

			<DeleteProductCategoryAlertDialog
				open={deletingCategory !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeletingCategory(null);
					}
				}}
				category={deletingCategory}
			/>
		</>
	);
}

function CategoryRowActions({
	onEdit,
	onDelete,
}: {
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label="Abrir acciones de categoria"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuItem onClick={onEdit}>
					<Pencil className="h-4 w-4" />
					Editar
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem variant="destructive" onClick={onDelete}>
					<Trash2 className="h-4 w-4" />
					Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
