import { createFileRoute } from "@tanstack/react-router";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";
import { OrderEditorComposerPage } from "@/features/orders/order-editor/components/order-editor-composer-page";
import { OrderEditorProvider } from "@/features/orders/order-editor/order-editor.context";

export const Route = createFileRoute("/_admin/dashboard/orders/new")({
	component: NewDraftOrderPage,
});

function NewDraftOrderPage() {
	return (
		<div className="px-6 pb-10">
			<PageBreadcrumb
				parent={{ label: "Pedidos", to: "/dashboard/orders" }}
				current="Nuevo borrador"
			/>

			<div className="space-y-1 pb-4">
				<h1 className="text-2xl font-semibold tracking-tight">
					Nuevo borrador
				</h1>
			</div>

			<OrderEditorProvider>
				<OrderEditorComposerPage mode="create-draft" />
			</OrderEditorProvider>
		</div>
	);
}
