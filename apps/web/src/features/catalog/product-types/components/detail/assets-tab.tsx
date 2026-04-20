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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssets } from "@/features/inventory/assets/assets.queries";
import { CreateAssetDialogForm } from "@/features/inventory/assets/components/create-asset-dialog-form";
import { DeactivateAssetAlertDialog } from "@/features/inventory/assets/components/deactivate-asset-alert-dialog";
import { DeleteAssetAlertDialog } from "@/features/inventory/assets/components/delete-asset-alert-dialog";
import { EditAssetDialog } from "@/features/inventory/assets/components/edit-asset-dialog";
import { ProductAssetsTimeline } from "./product-assets-timeline/product-assets-timeline";
import { useProduct } from "./product-detail.context";

interface AssetsTabProps {
	assetsView: "list" | "timeline";
	onAssetsViewChange: (view: "list" | "timeline") => void;
	timelineSearch: {
		timelinePreset: "day" | "week" | "2weeks";
		timelineFrom?: string;
		timelineTo?: string;
		showInactive: boolean;
	};
	onTimelineSearchChange: (
		updates: Partial<{
			timelinePreset: "day" | "week" | "2weeks";
			timelineFrom: string | undefined;
			timelineTo: string | undefined;
			showInactive: boolean;
		}>,
	) => void;
}

export function AssetsTab({
	assetsView,
	onAssetsViewChange,
	timelineSearch,
	onTimelineSearchChange,
}: AssetsTabProps) {
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
	const assets = items?.data.flatMap((group) => group.assets) ?? [];

	if (isPending && assetsView === "list") {
		return <p className="text-sm text-muted-foreground">Cargando assets...</p>;
	}

	return (
		<>
			<Tabs
				value={assetsView}
				onValueChange={(value) => {
					if (value === "list" || value === "timeline") {
						onAssetsViewChange(value);
					}
				}}
				className="flex flex-col gap-y-4"
			>
				<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-3">
						<h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
							Assets fisicos{" "}
							<span className="ml-1 text-foreground">
								({isPending ? "..." : assets.length})
							</span>
						</h3>
						<TabsList>
							<TabsTrigger value="list">Lista</TabsTrigger>
							<TabsTrigger value="timeline">Timeline</TabsTrigger>
						</TabsList>
					</div>

					<CreateAssetDialogForm />
				</div>

				<TabsContent value="list" hidden={assetsView !== "list"}>
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
								{assets.length === 0 ? (
									<tr className="border-b bg-muted/50">
										<td
											colSpan={6}
											className="px-4 py-3 text-center text-muted-foreground"
										>
											No hay assets cargados.
										</td>
									</tr>
								) : (
									assets.map((item) => (
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
				</TabsContent>

				<TabsContent value="timeline" hidden={assetsView !== "timeline"}>
					<ProductAssetsTimeline
						productTypeId={id}
						timelineSearch={timelineSearch}
						onTimelineSearchChange={onTimelineSearchChange}
					/>
				</TabsContent>
			</Tabs>

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
