import type { AssetResponseDto } from "@repo/schemas";
import { MoreHorizontal, Pencil, PowerOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAssets } from "@/features/inventory/assets/assets.queries";
import { CreateAssetDialogForm } from "@/features/inventory/assets/components/create-asset-dialog-form";
import { DeactivateAssetAlertDialog } from "@/features/inventory/assets/components/deactivate-asset-alert-dialog";
import { DeleteAssetAlertDialog } from "@/features/inventory/assets/components/delete-asset-alert-dialog";
import { EditAssetDialog } from "@/features/inventory/assets/components/edit-asset-dialog";
import { useProduct } from "./product-detail.context";

export function AssetsTab() {
	const {
		product: { id },
	} = useProduct();
	const [editingAsset, setEditingAsset] = useState<AssetResponseDto | null>(
		null,
	);
	const [deactivatingAsset, setDeactivatingAsset] =
		useState<AssetResponseDto | null>(null);
	const [deletingAsset, setDeletingAsset] = useState<AssetResponseDto | null>(
		null,
	);

	const { data: items, isPending } = useAssets({
		productTypeId: id,
	});

	if (isPending) {
		return <p className="text-sm text-muted-foreground">Cargando assets...</p>;
	}

	return (
		<>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
						Assets fisicos{" "}
						<span className="ml-1 text-foreground">
							({items?.data.length ?? 0})
						</span>
					</h3>
				</div>

				<CreateAssetDialogForm />

				<div className="rounded-md border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Numero de serie
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Ubicacion
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Propietario
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Alta
								</th>
								<th className="px-4 py-3 text-left font-medium text-muted-foreground">
									Estado
								</th>
								<th className="px-4 py-3 text-right font-medium text-muted-foreground">
									Acciones
								</th>
							</tr>
						</thead>
						<tbody className="divide-y">
							{items === undefined || items.data.length === 0 ? (
								<tr className="border-b bg-muted/50">
									<td
										colSpan={6}
										className="px-4 py-3 text-center text-muted-foreground"
									>
										No hay assets cargados.
									</td>
								</tr>
							) : (
								items.data.map((item) => (
									<PhysicalItemRow
										key={item.id}
										item={item}
										onEdit={() => setEditingAsset(item)}
										onDeactivate={() => setDeactivatingAsset(item)}
										onDelete={() => setDeletingAsset(item)}
									/>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			<EditAssetDialog
				open={editingAsset !== null}
				onOpenChange={(open) => {
					if (!open) {
						setEditingAsset(null);
					}
				}}
				asset={editingAsset}
			/>

			<DeactivateAssetAlertDialog
				open={deactivatingAsset !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeactivatingAsset(null);
					}
				}}
				asset={deactivatingAsset}
			/>

			<DeleteAssetAlertDialog
				open={deletingAsset !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDeletingAsset(null);
					}
				}}
				asset={deletingAsset}
			/>
		</>
	);
}

interface PhysicalItemRowProps {
	item: AssetResponseDto;
	onEdit: () => void;
	onDeactivate: () => void;
	onDelete: () => void;
}

function PhysicalItemRow({
	item,
	onEdit,
	onDeactivate,
	onDelete,
}: PhysicalItemRowProps) {
	const formattedDate = new Intl.DateTimeFormat("es-AR", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(item.createdAt));

	return (
		<tr className="hover:bg-muted/30 transition-colors">
			<td className="px-4 py-3 font-mono text-xs">
				{item.serialNumber ?? <span className="text-muted-foreground">—</span>}
			</td>
			<td className="px-4 py-3 text-muted-foreground">{item.location.name}</td>
			<td className="px-4 py-3 text-muted-foreground">
				{item.owner?.name ?? "—"}
			</td>
			<td className="px-4 py-3 text-muted-foreground">{formattedDate}</td>
			<td className="px-4 py-3">
				<AssetStatusBadge isActive={item.isActive} />
			</td>
			<td className="px-4 py-3 text-right">
				<AssetRowActions
					isActive={item.isActive}
					onEdit={onEdit}
					onDeactivate={onDeactivate}
					onDelete={onDelete}
				/>
			</td>
		</tr>
	);
}

function AssetStatusBadge({ isActive }: { isActive: boolean }) {
	if (isActive) {
		return <Badge variant="secondary">Activo</Badge>;
	}

	return <Badge variant="destructive">Inactivo</Badge>;
}

function AssetRowActions({
	isActive,
	onEdit,
	onDeactivate,
	onDelete,
}: {
	isActive: boolean;
	onEdit: () => void;
	onDeactivate: () => void;
	onDelete: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label="Abrir acciones del asset"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuItem onClick={onEdit}>
					<Pencil className="h-4 w-4" />
					Editar
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onDeactivate} disabled={!isActive}>
					<PowerOff className="h-4 w-4" />
					Desactivar
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
