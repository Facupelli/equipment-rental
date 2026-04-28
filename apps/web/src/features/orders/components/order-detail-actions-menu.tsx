import { OrderStatus } from "@repo/types";
import { ChevronDown, CircleSlash, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	useOrderBudget,
	useOrderCancellation,
	useOrderDetailContext,
	useOrderDocuments,
} from "@/features/orders/contexts/order-detail.context";

export function OrderDetailActionsMenu() {
	const { order } = useOrderDetailContext();
	const budget = useOrderBudget();
	const documents = useOrderDocuments();
	const cancellation = useOrderCancellation();
	const canOpenBudget =
		order.status === OrderStatus.DRAFT ||
		order.status === OrderStatus.PENDING_REVIEW;
	const canOpenContract =
		order.status === OrderStatus.CONFIRMED ||
		order.status === OrderStatus.ACTIVE ||
		order.status === OrderStatus.COMPLETED;
	const canCancel =
		order.status === OrderStatus.DRAFT ||
		order.status === OrderStatus.PENDING_REVIEW ||
		order.status === OrderStatus.CONFIRMED;

	if (!canOpenBudget && !canOpenContract && !canCancel) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="outline">
						Acciones
						<ChevronDown className="size-4" />
					</Button>
				}
			/>

			<DropdownMenuContent align="end" className="w-56">
				{canOpenBudget ? (
					<>
						<DropdownMenuItem onClick={budget.open} disabled={budget.isOpening}>
							<FileText className="mr-2 h-4 w-4" />
							{budget.isOpening ? "Abriendo presupuesto..." : "Ver presupuesto"}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={budget.download}
							disabled={budget.isDownloading}
						>
							<FileText className="mr-2 h-4 w-4" />
							{budget.isDownloading
								? "Descargando presupuesto..."
								: "Descargar presupuesto"}
						</DropdownMenuItem>
					</>
				) : null}

				{canOpenContract ? (
					<>
						{canOpenBudget ? <DropdownMenuSeparator /> : null}
						<DropdownMenuItem
							onClick={documents.contract.open}
							disabled={documents.contract.isOpening}
						>
							<FileText className="mr-2 h-4 w-4" />
							{documents.contract.isOpening
								? "Abriendo remito..."
								: "Ver remito"}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={documents.contract.download}
							disabled={documents.contract.isDownloading}
						>
							<FileText className="mr-2 h-4 w-4" />
							{documents.contract.isDownloading
								? "Descargando remito..."
								: "Descargar remito"}
						</DropdownMenuItem>
					</>
				) : null}

				{canCancel ? (
					<>
						{canOpenBudget || canOpenContract ? (
							<DropdownMenuSeparator />
						) : null}
						<DropdownMenuItem
							variant="destructive"
							onClick={cancellation.openDialog}
						>
							<CircleSlash className="mr-2 h-4 w-4" />
							Cancelar pedido
						</DropdownMenuItem>
					</>
				) : null}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
