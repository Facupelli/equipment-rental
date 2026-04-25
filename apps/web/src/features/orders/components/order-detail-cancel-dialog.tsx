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
import { useOrderCancellation } from "@/features/orders/contexts/order-detail.context";

export function OrderDetailCancelDialog() {
	const cancellation = useOrderCancellation();

	return (
		<AlertDialog
			open={cancellation.isDialogOpen}
			onOpenChange={cancellation.setIsDialogOpen}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
					<AlertDialogDescription>
						Estas por cancelar este pedido. Esta acción no se puede deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>

				{cancellation.error ? (
					<p className="text-sm text-destructive">{cancellation.error}</p>
				) : null}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={cancellation.isPending}>
						Volver
					</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						onClick={(event) => {
							event.preventDefault();
							void cancellation.submit();
						}}
						disabled={cancellation.isPending}
					>
						{cancellation.isPending ? "Cancelando..." : "Cancelar"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
