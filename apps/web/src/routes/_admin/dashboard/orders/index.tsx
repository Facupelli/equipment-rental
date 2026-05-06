import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OrdersTable } from "@/features/orders/components/orders-table";
import { OrdersToolbar } from "@/features/orders/components/orders-toolbar";
import { useOrders } from "@/features/orders/orders.queries";
import {
	hasExplicitOrdersSort,
	type OrdersListSearch,
	ordersListSearchSchema,
} from "@/features/orders/orders-list.search";
import { AdminRouteError } from "@/shared/components/admin-route-error";

export const Route = createFileRoute("/_admin/dashboard/orders/")({
	validateSearch: ordersListSearchSchema,
	errorComponent: ({ error }) => {
		return (
			<AdminRouteError
				error={error}
				genericMessage="No pudimos cargar los pedidos."
				forbiddenMessage="No tienes permisos para ver los pedidos."
			/>
		);
	},
	component: OrdersPage,
});

function OrdersPage() {
	const navigate = useNavigate();
	const search = Route.useSearch();
	const { data, isLoading, isError } = useOrders(search);

	const orders = data?.data ?? [];
	const meta = data?.meta;
	const hasActiveFilters = Boolean(
		search.dateLens ||
			search.locationId ||
			search.customerId ||
			search.statuses?.length ||
			search.orderNumber ||
			hasExplicitOrdersSort(search),
	);

	function updateSearch(updater: (prev: OrdersListSearch) => OrdersListSearch) {
		navigate({
			from: Route.fullPath,
			to: ".",
			search: (prev) => updater(prev),
		});
	}

	function resetToFirstPage(prev: OrdersListSearch): OrdersListSearch {
		return { ...prev, page: 1 };
	}

	function clearExplicitSort(prev: OrdersListSearch): OrdersListSearch {
		return {
			...prev,
			sortBy: undefined,
			sortDirection: undefined,
		};
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Pedidos</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Lista operativa para revisar, filtrar y entrar rápido al detalle del
						pedido.
					</p>
				</div>

				<Button render={<Link to="/dashboard/orders/new">Nuevo borrador</Link>} />
			</div>

			<OrdersToolbar
				search={search}
				hasActiveFilters={hasActiveFilters}
				onDateLensChange={(dateLens) =>
					updateSearch((prev) => {
						const next = resetToFirstPage({ ...prev, dateLens });
						return hasExplicitOrdersSort(prev) ? next : clearExplicitSort(next);
					})
				}
				onStatusesChange={(statuses) =>
					updateSearch((prev) =>
						resetToFirstPage({ ...prev, statuses }),
					)
				}
				onLocationChange={(locationId) =>
					updateSearch((prev) => resetToFirstPage({ ...prev, locationId }))
				}
				onOrderNumberSubmit={(orderNumber) =>
					updateSearch((prev) => resetToFirstPage({ ...prev, orderNumber }))
				}
				onReset={() =>
					updateSearch((prev) => ({
						...prev,
						page: 1,
						limit: prev.limit,
						locationId: undefined,
						customerId: undefined,
						statuses: undefined,
						orderNumber: undefined,
						dateLens: undefined,
						sortBy: undefined,
						sortDirection: undefined,
					}))
				}
			/>

			<OrdersTable
				orders={orders}
				meta={meta}
				search={search}
				isLoading={isLoading}
				isError={isError}
				onPageChange={(page) => updateSearch((prev) => ({ ...prev, page }))}
				onSortChange={(sortBy, nextDirection) =>
					updateSearch((prev) => ({
						...resetToFirstPage(prev),
						sortBy: nextDirection ? sortBy : undefined,
						sortDirection: nextDirection,
					}))
				}
				onRowClick={(order) =>
					navigate({
						to: "/dashboard/orders/$orderId",
						params: { orderId: order.id },
						search,
					})
				}
			/>
		</div>
	);
}
