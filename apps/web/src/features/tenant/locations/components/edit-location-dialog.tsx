import type { LocationListItemResponse } from "@repo/schemas";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateLocation } from "../locations.queries";
import {
	locationToFormValues,
	toUpdateLocationDto,
} from "../schemas/location-form.schema";
import { LocationForm } from "./location-form";

interface EditLocationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	location: LocationListItemResponse | null;
}

const formId = "edit-location";

export function EditLocationDialog({
	open,
	onOpenChange,
	location,
}: EditLocationDialogProps) {
	const { mutateAsync: updateLocation, isPending } = useUpdateLocation();

	if (!location) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Editar ubicación</DialogTitle>
					<DialogDescription>
						Actualiza los datos de la ubicación para mantener tu operación
						organizada.
					</DialogDescription>
				</DialogHeader>

				{open && (
					<LocationForm
						key={location.id}
						formId={formId}
						defaultValues={locationToFormValues(location)}
						onCancel={() => onOpenChange(false)}
						isPending={isPending}
						submitLabel="Guardar cambios"
						pendingLabel="Guardando..."
						onSubmit={async ({ dirtyValues }) => {
							await updateLocation({
								locationId: location.id,
								dto: toUpdateLocationDto(dirtyValues),
							});
							onOpenChange(false);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
