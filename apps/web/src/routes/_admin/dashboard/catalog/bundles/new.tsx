import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCreateBundle } from "@/features/catalog/bundles/bundles.queries";
import { BundleForm } from "@/features/catalog/bundles/components/bundle-form";
import {
	bundleFormDefaults,
	toCreateBundleDto,
} from "@/features/catalog/bundles/schemas/bundle-form.schema";
import { tenantQueries } from "@/features/tenant/tenant.queries";

export const Route = createFileRoute("/_admin/dashboard/catalog/bundles/new")({
	component: RouteComponent,
});

const formId = "create-bundle";

function RouteComponent() {
	const navigate = useNavigate();
	const {
		data: { billingUnits },
	} = useSuspenseQuery(tenantQueries.me());
	const { mutateAsync: createBundle, isPending } = useCreateBundle();

	return (
		<BundleForm
			formId={formId}
			defaultValues={bundleFormDefaults}
			billingUnits={billingUnits}
			onCancel={() => navigate({ to: "/dashboard/catalog/bundles" })}
			isPending={isPending}
			heading="Crear combo"
			description="Agrega productos y asigna una unidad de cobro compartida."
			submitLabel="Crear combo"
			pendingLabel="Creando..."
			cancelLabel="Cancelar"
			onSubmit={async ({ values }) => {
				const bundleId = await createBundle(toCreateBundleDto(values));
				navigate({
					to: "/dashboard/catalog/bundles/$bundleId",
					params: { bundleId },
				});
			}}
		/>
	);
}
