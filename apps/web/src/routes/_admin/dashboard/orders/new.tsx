import { createFileRoute } from "@tanstack/react-router";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";
import { DraftOrderComposerPage } from "@/features/orders/draft-order/components/draft-order-composer-page";
import { DraftOrderProvider } from "@/features/orders/draft-order/draft-order.context";

export const Route = createFileRoute("/_admin/dashboard/orders/new")({
	component: NewDraftOrderPage,
});

function NewDraftOrderPage() {
	return (
		<div className="space-y-6 p-6">
			<PageBreadcrumb
				parent={{ label: "Pedidos", to: "/dashboard/orders" }}
				current="Nuevo borrador"
			/>

			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Nuevo borrador
				</h1>
				<p className="text-sm text-muted-foreground">
					Composer local para un draft order admin. El estado vive sólo en
					memoria hasta implementar `Save draft`.
				</p>
			</div>

			<DraftOrderProvider>
				<DraftOrderComposerPage />
			</DraftOrderProvider>
		</div>
	);
}
