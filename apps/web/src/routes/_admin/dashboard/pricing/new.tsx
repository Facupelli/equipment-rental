import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CreatePromotionForm } from "@/features/pricing/promotions/components/create-promotion-form";

export const Route = createFileRoute("/_admin/dashboard/pricing/new")({
	component: CreatePromotionPage,
});

function CreatePromotionPage() {
	const navigate = useNavigate();

	function goBack() {
		navigate({
			to: "/dashboard/pricing",
			search: {
				tab: "promotions",
				page: 1,
				search: undefined,
				activationType: undefined,
			},
		});
	}

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			<Card>
				<CardHeader>
					<CardTitle>Nueva promocion</CardTitle>
					<CardDescription>
						Configura activacion, condiciones, aplicabilidad y efecto de la
						promocion en una vista mas comoda para formularios largos.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<CreatePromotionForm onCancel={goBack} onSuccess={goBack} />
				</CardContent>
			</Card>
		</div>
	);
}
