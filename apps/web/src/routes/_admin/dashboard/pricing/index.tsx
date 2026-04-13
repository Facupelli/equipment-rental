import z from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CreateLongRentalDiscountDialogForm } from "@/features/pricing/long-rental-discounts/components/create-long-rental-discount-dialog-form";
import { LongRentalDiscountsTab } from "@/features/pricing/long-rental-discounts/components/long-rental-discounts-tab";
import { CreatePromotionDialogForm } from "@/features/pricing/promotions/components/create-promotion-dialog-form";
import { PromotionsTab } from "@/features/pricing/promotions/components/promotions-tab";
import { PricingRulesTab } from "@/features/pricing/pricing-rules/components/pricing-rules-tab";
import { CouponsTab } from "@/features/pricing/coupons/components/coupons-tab";
import { CreatePricingRuleDialogForm } from "@/features/pricing/pricing-rules/components/create-pricing-rule-dialog-form";
import { CreateCouponDialogForm } from "@/features/pricing/coupons/components/create-coupon-dialog-form";
import { AdminRouteError } from "@/shared/components/admin-route-error";

const promotionsSearchSchema = z.object({
	tab: z
		.enum(["rules", "coupons", "long-rental-discounts", "promotions"])
		.default("long-rental-discounts"),
	page: z.number().int().min(1).default(1),
	search: z.string().optional(),
});

type Tab = "rules" | "coupons" | "long-rental-discounts" | "promotions";

export const Route = createFileRoute("/_admin/dashboard/pricing/")({
	validateSearch: promotionsSearchSchema,
	errorComponent: ({ error }) => {
		return (
			<AdminRouteError
				error={error}
				genericMessage="No pudimos cargar la página de promociones."
				forbiddenMessage="No tienes permisos para ver las promociones."
			/>
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate({ from: Route.fullPath });
	const { tab } = Route.useSearch();

	function handleTabChange(value: string) {
		navigate({
			search: () => ({
				tab: value as Tab,
				page: 1,
				search: undefined,
			}),
		});
	}

	return (
		<div className="space-y-6 px-6 py-8 max-w-6xl mx-auto">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Promociones</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Gestiona incentivos de precios y códigos promocionales para tu flota
						de alquiler.
					</p>
				</div>
				{tab === "long-rental-discounts" && (
					<CreateLongRentalDiscountDialogForm />
				)}
				{tab === "promotions" && <CreatePromotionDialogForm />}
				{tab === "rules" && <CreatePricingRuleDialogForm />}
				{tab === "coupons" && <CreateCouponDialogForm />}
			</div>

			{/* Tabs */}
			<Tabs
				value={tab}
				onValueChange={handleTabChange}
				className="flex flex-col gap-y-10"
			>
				<TabsList>
					<TabsTrigger value="long-rental-discounts">
						Descuentos por alquiler largo
					</TabsTrigger>
					<TabsTrigger value="promotions">Promociones</TabsTrigger>
					<TabsTrigger value="rules">Reglas de Precio</TabsTrigger>
					<TabsTrigger value="coupons">Cupones</TabsTrigger>
				</TabsList>

				<TabsContent
					value="long-rental-discounts"
					hidden={tab !== "long-rental-discounts"}
				>
					<LongRentalDiscountsTab />
				</TabsContent>

				<TabsContent value="promotions" hidden={tab !== "promotions"}>
					<PromotionsTab />
				</TabsContent>

				<TabsContent value="rules" hidden={tab !== "rules"}>
					<PricingRulesTab />
				</TabsContent>

				<TabsContent value="coupons" hidden={tab !== "coupons"}>
					<CouponsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
