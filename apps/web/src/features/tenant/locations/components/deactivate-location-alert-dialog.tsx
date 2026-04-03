import type { LocationListItemResponse } from "@repo/schemas";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProblemDetailsError } from "@/shared/errors";
import { useDeactivateLocation } from "../locations.queries";

interface DeactivateLocationAlertDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	location: LocationListItemResponse | null;
}

export function DeactivateLocationAlertDialog({
	open,
	onOpenChange,
	location,
}: DeactivateLocationAlertDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { mutateAsync: deactivateLocation, isPending } =
		useDeactivateLocation();

	if (!location) {
		return null;
	}

	const selectedLocation = location!;

	async function handleDeactivate() {
		setErrorMessage(null);

		try {
			await deactivateLocation({ locationId: selectedLocation.id });
			onOpenChange(false);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setErrorMessage(
					error.problemDetails.detail ??
						error.problemDetails.title ??
						"No se pudo desactivar la ubicación.",
				);
				return;
			}

			setErrorMessage("Ocurrió un error al desactivar la ubicación.");
		}
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					setErrorMessage(null);
				}

				onOpenChange(nextOpen);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Desactivar ubicación</AlertDialogTitle>
					<AlertDialogDescription>
						Vas a desactivar la ubicación "{selectedLocation.name}". Dejará de
						estar disponible para operaciones activas, pero conservará su
						historial.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{errorMessage && (
					<p className="text-sm text-destructive">{errorMessage}</p>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDeactivate}
						disabled={isPending}
					>
						{isPending ? "Desactivando..." : "Desactivar"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
