import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProduct } from "@/features/catalog/product-types/components/detail/product-detail.context";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useOwners } from "@/features/tenant/owners/owners.queries";
import { useLocationId } from "@/shared/contexts/location/location.hooks";
import { useCreateAsset } from "../assets.queries";
import {
  getAssetFormDefaults,
  toCreateAssetDto,
} from "../schemas/asset-form.schema";
import { AssetForm } from "./asset-form";

const formId = "create-asset";

export function CreateAssetDialogForm() {
  const locationId = useLocationId();
  const { product } = useProduct();
  const [open, setOpen] = useState(false);

  const { mutateAsync: createAsset, isPending } = useCreateAsset();
  const { data: locations = [], isLoading: isLocationsLoading } =
    useLocations();
  const { data: owners = [], isLoading: isOwnersLoading } = useOwners();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Agregar asset
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear asset</DialogTitle>
          <DialogDescription>
            Agrega un nuevo asset fisico para {product.name}.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <AssetForm
            formId={formId}
            defaultValues={getAssetFormDefaults(locationId)}
            onCancel={() => setOpen(false)}
            isPending={isPending}
            submitLabel="Crear"
            pendingLabel="Creando..."
            locations={locations}
            owners={owners}
            isLocationsLoading={isLocationsLoading}
            isOwnersLoading={isOwnersLoading}
            trackingMode={product.trackingMode}
            onSubmit={async ({ values }) => {
              await createAsset(toCreateAssetDto(values, product.id));
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
