import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PromotionActivationType } from "@repo/types";
import z from "zod";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { PromotionForm } from "@/features/pricing/promotions/components/create-promotion-form";
import { useUpdatePromotion } from "@/features/pricing/promotions/promotions.mutations";
import { promotionQueries } from "@/features/pricing/promotions/promotions.queries";
import {
	promotionToFormValues,
	toCreatePromotionDto,
} from "@/features/pricing/promotions/schemas/promotion-form.schema";

const promotionsSearchSchema = z.object({
	tab: z.enum(["coupons", "promotions"]).default("promotions"),
	page: z.number().int().min(1).default(1),
	search: z.string().optional(),
	activationType: z.enum(PromotionActivationType).optional(),
});

const formId = "edit-promotion";

export const Route = createFileRoute(
	"/_admin/dashboard/promotions/$promotionId/edit",
)({
	validateSearch: promotionsSearchSchema,
	loader: ({ context: { queryClient }, params: { promotionId } }) =>
		queryClient.ensureQueryData(promotionQueries.detail(promotionId)),
	component: EditPromotionPage,
});

function EditPromotionPage() {
	const { promotionId } = Route.useParams();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const { data: promotion } = useSuspenseQuery(
		promotionQueries.detail(promotionId),
	);
	const { mutateAsync: updatePromotion, isPending } = useUpdatePromotion();

	function goBack() {
		navigate({
			to: "/dashboard/promotions",
			search,
		});
	}

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Editar promocion</CardTitle>
					<CardDescription>
						Actualiza la configuracion de la promocion sin perder el contexto de
						tu listado.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<PromotionForm
						key={promotion.id}
						formId={formId}
						defaultValues={promotionToFormValues(promotion)}
						onCancel={goBack}
						onSubmit={async (values) => {
							await updatePromotion({
								promotionId: promotion.id,
								dto: toCreatePromotionDto(values),
							});
							goBack();
						}}
						isPending={isPending}
						submitLabel="Guardar cambios"
						pendingLabel="Guardando..."
					/>
				</CardContent>
			</Card>
		</div>
	);
}
