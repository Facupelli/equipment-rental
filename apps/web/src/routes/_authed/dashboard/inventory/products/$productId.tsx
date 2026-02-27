import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhysicalItemsTab } from "@/features/inventory/products/components/detail/assets-tab";
import { PricingTab } from "@/features/inventory/products/components/detail/pricing-tab";
import { SpecificationsTab } from "@/features/inventory/products/components/detail/specifications-tab";
import { formatTrackingType } from "@/features/inventory/products/components/products-columns";
import { useProductDetail } from "@/features/inventory/products/products.queries";
import type { ProductDetailDto } from "@repo/schemas";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/dashboard/inventory/products/$productId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { productId } = Route.useParams();
  const { tenant } = Route.useRouteContext();
  const { data: product, isPending } = useProductDetail(productId, {
    enabled: !!productId,
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Product not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <ProductHeader product={product} />

      <Tabs defaultValue="specifications" className="flex flex-col gap-y-10">
        <TabsList>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="physical-items">Physical Items</TabsTrigger>
        </TabsList>

        <TabsContent value="specifications">
          <SpecificationsTab product={product} />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingTab product={product} tenant={tenant} />
        </TabsContent>

        <TabsContent value="physical-items">
          <PhysicalItemsTab product={product} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProductHeaderProps {
  product: ProductDetailDto;
}

function ProductHeader({ product }: ProductHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {product.category && (
            <>
              <span>{product.category.name}</span>
              <span>·</span>
            </>
          )}
          <Badge variant="outline">
            {formatTrackingType(product.trackingType)}
          </Badge>
        </div>
      </div>

      <Button
        variant="outline"
        render={
          <Link
            to="/dashboard/inventory/products/$productId"
            params={{ productId: product.id }}
          >
            Edit Product
          </Link>
        }
      />
    </div>
  );
}
