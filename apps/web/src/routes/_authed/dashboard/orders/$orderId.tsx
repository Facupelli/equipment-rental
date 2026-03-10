import { createOrderDetailQueryOptions } from "@/features/orders/queries/get-order-by-id";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/orders/$orderId")({
  loader: ({ context: { queryClient }, params: { orderId } }) => {
    queryClient.ensureQueryData(createOrderDetailQueryOptions({ orderId }));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { orderId } = Route.useParams();

  const { data: order } = useSuspenseQuery(
    createOrderDetailQueryOptions({ orderId }),
  );

  console.log({ order });

  return <div>Hello "/_authed/dashboard/orders/$orderId"!</div>;
}
