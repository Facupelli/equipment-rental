import type { AssetResponseDto } from "@repo/schemas";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useProduct } from "@/features/catalog/product-types/components/detail/product-detail.context";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useOwners } from "@/features/tenant/owners/owners.queries";
import { useUpdateAsset } from "../assets.queries";
import {
	assetToFormValues,
	toUpdateAssetDto,
} from "../schemas/asset-form.schema";
import { AssetForm } from "./asset-form";

interface EditAssetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	asset: AssetResponseDto | null;
}

const formId = "edit-asset";

export function EditAssetDialog({
	open,
	onOpenChange,
	asset,
}: EditAssetDialogProps) {
	const { product } = useProduct();
	const { mutateAsync: updateAsset, isPending } = useUpdateAsset();
	const { data: locations = [], isLoading: isLocationsLoading } =
		useLocations();
	const { data: owners = [], isLoading: isOwnersLoading } = useOwners();

	if (!asset) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar asset</DialogTitle>
					<DialogDescription>
						Actualiza los datos del asset para mantener tu catalogo al dia.
					</DialogDescription>
				</DialogHeader>

				{open && (
					<AssetForm
						key={asset.id}
						formId={formId}
						defaultValues={assetToFormValues({
							locationId: asset.location.id,
							ownerId: asset.owner?.id ?? null,
							serialNumber: asset.serialNumber,
							notes: asset.notes,
						})}
						onCancel={() => onOpenChange(false)}
						isPending={isPending}
						submitLabel="Guardar cambios"
						pendingLabel="Guardando..."
						locations={locations}
						owners={owners}
						isLocationsLoading={isLocationsLoading}
						isOwnersLoading={isOwnersLoading}
						trackingMode={product.trackingMode}
						onSubmit={async ({ dirtyValues }) => {
							await updateAsset({
								assetId: asset.id,
								dto: toUpdateAssetDto(dirtyValues),
							});
							onOpenChange(false);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
