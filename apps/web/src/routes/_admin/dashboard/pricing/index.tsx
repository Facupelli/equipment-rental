import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import z from "zod";
import { PricingRulesTab } from "@/features/pricing/pricing-rules/components/pricing-rules-tab";
import { CouponsTab } from "@/features/pricing/coupons/components/coupons-tab";

const promotionsSearchSchema = z.object({
  tab: z.enum(["rules", "coupons"]).default("rules"),
  page: z.number().int().min(1).default(1),
  search: z.string().optional(),
});

type Tab = "rules" | "coupons";

export const Route = createFileRoute("/_admin/dashboard/pricing/")({
  validateSearch: promotionsSearchSchema,
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
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Nueva Regla
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="flex flex-col gap-y-10"
      >
        <TabsList>
          <TabsTrigger value="rules">Reglas de Precio</TabsTrigger>
          <TabsTrigger value="coupons">Cupones</TabsTrigger>
        </TabsList>

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
