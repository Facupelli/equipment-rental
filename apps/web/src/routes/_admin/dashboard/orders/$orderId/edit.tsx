import { OrderStatus } from "@repo/types";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";
import { DraftOrderComposerPage } from "@/features/orders/draft-order/components/draft-order-composer-page";
import { DraftOrderProvider } from "@/features/orders/draft-order/draft-order.context";
import { orderToDraftOrderState } from "@/features/orders/draft-order/utils/order-to-draft-state";
import { createOrderDetailQueryOptions } from "@/features/orders/queries/get-order-by-id";

export const Route = createFileRoute("/_admin/dashboard/orders/$orderId/edit")({
	beforeLoad: async ({ context: { queryClient }, params: { orderId } }) => {
		const order = await queryClient.ensureQueryData(
			createOrderDetailQueryOptions({ orderId }),
		);

		if (order.status !== OrderStatus.DRAFT) {
			throw redirect({
				to: "/dashboard/orders/$orderId",
				params: { orderId },
			});
		}
	},
	loader: ({ context: { queryClient }, params: { orderId } }) => {
		// Data is already in cache from beforeLoad, this is effectively free
		return queryClient.ensureQueryData(
			createOrderDetailQueryOptions({ orderId }),
		);
	},
	component: EditDraftOrderPage,
	preload: false,
});

function EditDraftOrderPage() {
	console.log("EDIT DRAFT ORDER PAGE");

	const { orderId } = Route.useParams();
	const { data: draftOrder } = useSuspenseQuery(
		createOrderDetailQueryOptions({ orderId }),
	);

	return (
		<div className="px-6 pb-10">
			<PageBreadcrumb
				parent={{ label: "Pedidos", to: "/dashboard/orders" }}
				current="Editar borrador"
			/>

			<div className="space-y-1 pb-4">
				<h1 className="text-2xl font-semibold tracking-tight">
					Editar borrador
				</h1>
			</div>

			<DraftOrderProvider initialOrder={orderToDraftOrderState(draftOrder)}>
				<DraftOrderComposerPage orderId={orderId} />
			</DraftOrderProvider>
		</div>
	);
}
