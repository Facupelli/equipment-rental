import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/dashboard/catalog/bundles/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/dashboard/catalog/bundles/"!</div>
}
