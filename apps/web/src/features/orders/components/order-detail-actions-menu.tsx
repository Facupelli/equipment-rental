import { OrderStatus } from "@repo/types";
import { CircleSlash, FileText, MoreHorizontal, Pencil } from "lucide-react";
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
	const { order, actions } = useOrderDetailContext();
	const budget = useOrderBudget();
	const documents = useOrderDocuments();
	const cancellation = useOrderCancellation();
	const isDraft = order.status === OrderStatus.DRAFT;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="outline"
						size="icon"
						className="px-4 rounded-sm border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
					>
						<MoreHorizontal className="size-4" />
						<span className="sr-only">Más acciones</span>
					</Button>
				}
			/>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem onClick={actions.edit.open} disabled={!isDraft}>
					<Pencil className="mr-2 h-4 w-4" />
					Editar pedido
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{isDraft ? (
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
				) : (
					<>
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
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					onClick={cancellation.openDialog}
				>
					<CircleSlash className="mr-2 h-4 w-4" />
					Cancelar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
