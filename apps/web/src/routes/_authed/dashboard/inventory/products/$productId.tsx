import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authed/dashboard/inventory/products/$productId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/dashboard/inventory/products/$productId"!</div>
}
