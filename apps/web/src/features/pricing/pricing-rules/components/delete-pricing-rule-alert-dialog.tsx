import type { PricingRuleView } from "@repo/schemas";
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
import { useDeletePricingRule } from "../pricing-rules.queries";

interface DeletePricingRuleAlertDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	pricingRule: PricingRuleView | null;
}

export function DeletePricingRuleAlertDialog({
	open,
	onOpenChange,
	pricingRule,
}: DeletePricingRuleAlertDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { mutateAsync: deletePricingRule, isPending } = useDeletePricingRule();

	if (!pricingRule) {
		return null;
	}

	async function handleDelete() {
		if (!pricingRule) {
			return;
		}

		setErrorMessage(null);

		try {
			await deletePricingRule({ pricingRuleId: pricingRule.id });
			onOpenChange(false);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setErrorMessage(
					error.problemDetails.detail ??
						error.problemDetails.title ??
						"No se pudo eliminar la regla.",
				);
				return;
			}

			setErrorMessage("Ocurrio un error al eliminar la regla.");
		}
	}

	return (
		<AlertDialog
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					setErrorMessage(null);
				}

				onOpenChange(next);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Eliminar regla de precio</AlertDialogTitle>
					<AlertDialogDescription>
						Estas por eliminar la regla "{pricingRule.name}". Esta accion no se
						puede deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{errorMessage && (
					<p className="text-sm text-destructive">{errorMessage}</p>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={handleDelete}
						disabled={isPending}
					>
						{isPending ? "Eliminando..." : "Eliminar"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
