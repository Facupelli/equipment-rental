import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useCreateLocation } from "@/features/tenant/locations/locations.queries";
import {
	locationFormDefaults,
	toCreateLocationDto,
} from "../schemas/location-form.schema";
import { LocationForm } from "./location-form";

interface CreateLocationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const formId = "create-location";

export function CreateLocationDialog({
	open,
	onOpenChange,
}: CreateLocationDialogProps) {
	const { mutateAsync: createLocation, isPending } = useCreateLocation();

	function handleOpenChange(nextOpen: boolean) {
		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Crear ubicación</DialogTitle>
					<DialogDescription>
						Agrega una nueva ubicación para operar y organizar tu inventario.
					</DialogDescription>
				</DialogHeader>

				{open && (
					<LocationForm
						formId={formId}
						defaultValues={locationFormDefaults}
						onCancel={() => handleOpenChange(false)}
						isPending={isPending}
						submitLabel="Crear"
						pendingLabel="Creando..."
						showIsActiveField
						onSubmit={async ({ values }) => {
							await createLocation(toCreateLocationDto(values));
							handleOpenChange(false);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
