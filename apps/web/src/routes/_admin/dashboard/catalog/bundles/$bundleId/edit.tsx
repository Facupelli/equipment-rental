import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	bundleQueries,
	useUpdateBundle,
} from "@/features/catalog/bundles/bundles.queries";
import { BundleForm } from "@/features/catalog/bundles/components/bundle-form";
import {
	bundleToFormValues,
	toUpdateBundleDto,
} from "@/features/catalog/bundles/schemas/bundle-form.schema";
import { tenantQueries } from "@/features/tenant/tenant.queries";

export const Route = createFileRoute(
	"/_admin/dashboard/catalog/bundles/$bundleId/edit",
)({
	loader: ({ context: { queryClient }, params: { bundleId } }) =>
		queryClient.ensureQueryData(bundleQueries.detail(bundleId)),
	component: RouteComponent,
});

const formId = "edit-bundle";

function RouteComponent() {
	const navigate = useNavigate();
	const { bundleId } = Route.useParams();
	const { data: bundle } = useSuspenseQuery(bundleQueries.detail(bundleId));
	const {
		data: { billingUnits },
	} = useSuspenseQuery(tenantQueries.me());
	const { mutateAsync: updateBundle, isPending } = useUpdateBundle();

	return (
		<BundleForm
			key={bundle.id}
			formId={formId}
			defaultValues={bundleToFormValues(bundle)}
			billingUnits={billingUnits}
			onCancel={() =>
				navigate({
					to: "/dashboard/catalog/bundles/$bundleId",
					params: { bundleId: bundle.id },
				})
			}
			isPending={isPending}
			heading="Editar combo"
			description="Actualiza los datos del combo y sus componentes."
			submitLabel="Guardar cambios"
			pendingLabel="Guardando..."
			cancelLabel="Cancelar"
			onSubmit={async ({ dirtyValues }) => {
				await updateBundle({
					bundleId: bundle.id,
					dto: toUpdateBundleDto(dirtyValues),
				});

				navigate({
					to: "/dashboard/catalog/bundles/$bundleId",
					params: { bundleId: bundle.id },
				});
			}}
		/>
	);
}
