import { PromotionActivationType } from "@repo/types";
import z from "zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PromotionsTab } from "@/features/pricing/promotions/components/promotions-tab";
import { CouponsTab } from "@/features/pricing/coupons/components/coupons-tab";
import { CreateCouponDialogForm } from "@/features/pricing/coupons/components/create-coupon-dialog-form";
import { AdminRouteError } from "@/shared/components/admin-route-error";

const promotionsSearchSchema = z.object({
	tab: z.enum(["coupons", "promotions"]).default("promotions"),
	page: z.number().int().min(1).default(1),
	search: z.string().optional(),
	activationType: z.enum(PromotionActivationType).optional(),
});

type Tab = "coupons" | "promotions";

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
				activationType: undefined,
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
				{tab === "promotions" && (
					<Button
						className="shrink-0 gap-2"
						render={<Link to="/dashboard/pricing/new">Nueva promocion</Link>}
					/>
				)}
				{tab === "coupons" && <CreateCouponDialogForm />}
			</div>

			{/* Tabs */}
			<Tabs
				value={tab}
				onValueChange={handleTabChange}
				className="flex flex-col gap-y-10"
			>
				<TabsList>
					<TabsTrigger value="promotions">Promociones</TabsTrigger>
					<TabsTrigger value="coupons">Cupones</TabsTrigger>
				</TabsList>

				<TabsContent value="promotions" hidden={tab !== "promotions"}>
					<PromotionsTab />
				</TabsContent>

				<TabsContent value="coupons" hidden={tab !== "coupons"}>
					<CouponsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
