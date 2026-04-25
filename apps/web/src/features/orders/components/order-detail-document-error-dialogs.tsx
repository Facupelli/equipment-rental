import { OrderStatus } from "@repo/types";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	useOrderDetailContext,
	useOrderDocuments,
} from "@/features/orders/contexts/order-detail.context";

export function OrderDetailDocumentErrorDialogs() {
	const { order } = useOrderDetailContext();
	const documents = useOrderDocuments();
	const documentLabel =
		order.status === OrderStatus.DRAFT ? "presupuesto" : "remito";

	return (
		<>
			<AlertDialog
				open={documents.error.isBusinessErrorOpen}
				onOpenChange={(open) => {
					if (!open) {
						documents.error.setBusinessMessage(null);
					}

					documents.error.setIsBusinessErrorOpen(open);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							No se pudo generar el {documentLabel}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{documents.error.businessMessage ??
								"No pudimos generar este documento en este momento."}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => {
								documents.error.setBusinessMessage(null);
								documents.error.setIsBusinessErrorOpen(false);
							}}
						>
							Entendido
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={Boolean(documents.error.contractError)}
				onOpenChange={(open) => {
					if (!open) {
						documents.error.setContractError(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{documents.error.contractError?.status === 404
								? "Pedido no encontrado"
								: `No se pudo ${documents.error.contractError?.action === "download" ? "descargar" : "abrir"} el ${documentLabel}`}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{documents.error.contractError?.message}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction
							onClick={() => documents.error.setContractError(null)}
						>
							Cerrar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
