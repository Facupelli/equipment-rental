import { CustomerForm } from "@/features/customer/components/onboard-form/onboard-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_portal/_tenant/onboard/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <CustomerForm customerId="1" />;
}
