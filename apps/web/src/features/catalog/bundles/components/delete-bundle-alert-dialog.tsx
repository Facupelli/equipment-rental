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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRetireBundle } from "@/features/catalog/bundles/bundles.queries";
import { ProblemDetailsError } from "@/shared/errors";

interface DeleteBundleAlertDialogProps {
	bundleId: string;
	bundleName: string;
	disabled?: boolean;
}

export function DeleteBundleAlertDialog({
	bundleId,
	bundleName,
	disabled = false,
}: DeleteBundleAlertDialogProps) {
	const [open, setOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { mutateAsync: retireBundle, isPending } = useRetireBundle();

	async function handleRetire() {
		setErrorMessage(null);

		try {
			await retireBundle({ bundleId });
			setOpen(false);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setErrorMessage(
					error.problemDetails.detail ??
						error.problemDetails.title ??
						"No se pudo retirar el combo.",
				);
				return;
			}

			setErrorMessage("Ocurrio un error al retirar el combo.");
		}
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(nextOpen) => {
				setOpen(nextOpen);
				if (!nextOpen) {
					setErrorMessage(null);
				}
			}}
		>
			<AlertDialogTrigger
				render={
					<button
						type="button"
						disabled={disabled || isPending}
						className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						{isPending ? "Retirando..." : "Retirar"}
					</button>
				}
			/>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Retirar combo</AlertDialogTitle>
					<AlertDialogDescription>
						Vas a retirar el combo &quot;{bundleName}&quot;. Dejara de estar
						disponible en el catalogo de alquiler y esta accion no se puede
						deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{errorMessage && (
					<p className="text-sm text-destructive">{errorMessage}</p>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleRetire}
						disabled={isPending}
					>
						{isPending ? "Retirando..." : "Retirar combo"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
