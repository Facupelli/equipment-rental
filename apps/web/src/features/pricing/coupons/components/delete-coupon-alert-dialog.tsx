import type { CouponView } from "@repo/schemas";
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
import { useDeleteCoupon } from "../coupons.queries";

interface DeleteCouponAlertDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	coupon: CouponView | null;
}

export function DeleteCouponAlertDialog({
	open,
	onOpenChange,
	coupon,
}: DeleteCouponAlertDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { mutateAsync: deleteCoupon, isPending } = useDeleteCoupon();

	if (!coupon) {
		return null;
	}

	async function handleDelete() {
		if (!coupon) {
			return;
		}

		setErrorMessage(null);

		try {
			await deleteCoupon({ couponId: coupon.id });
			onOpenChange(false);
		} catch (error) {
			if (error instanceof ProblemDetailsError) {
				setErrorMessage(
					error.problemDetails.detail ??
						error.problemDetails.title ??
						"No se pudo eliminar el cupon.",
				);
				return;
			}

			console.log({ error });

			setErrorMessage("Ocurrio un error al eliminar el cupon.");
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
					<AlertDialogTitle>Eliminar cupon</AlertDialogTitle>
					<AlertDialogDescription>
						Estas por eliminar el cupon "{coupon.code}". Esta accion no se puede
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
