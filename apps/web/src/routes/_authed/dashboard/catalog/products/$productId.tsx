import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetsTab } from "@/features/catalog/product-types/components/detail/assets-tab";
import { PricingTab } from "@/features/catalog/product-types/components/detail/pricing-tab";
import {
  ProductProvider,
  useProduct,
} from "@/features/catalog/product-types/components/detail/product-detail.context";
import { SpecificationsTab } from "@/features/catalog/product-types/components/detail/specifications-tab";
import { formatTrackingType } from "@/features/catalog/product-types/components/products-columns";
import { useProductDetail } from "@/features/catalog/product-types/products.queries";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/dashboard/catalog/products/$productId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { productId } = Route.useParams();
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
    <ProductProvider product={product}>
      <div className="space-y-6 p-6">
        <ProductHeader />

        <Tabs defaultValue="specifications" className="flex flex-col gap-y-10">
          <TabsList>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="physical-items">Physical Items</TabsTrigger>
          </TabsList>

          <TabsContent value="specifications">
            <SpecificationsTab />
          </TabsContent>

          <TabsContent value="pricing">
            <PricingTab />
          </TabsContent>

          <TabsContent value="physical-items">
            <AssetsTab />
          </TabsContent>
        </Tabs>
      </div>
    </ProductProvider>
  );
}

function ProductHeader() {
  const { product } = useProduct();

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
            {formatTrackingType(product.trackingMode)}
          </Badge>
        </div>
      </div>

      <Button
        variant="outline"
        nativeButton={false}
        render={
          <Link
            to="/dashboard/catalog/products/$productId"
            params={{ productId: product.id }}
          >
            Edit Product
          </Link>
        }
      />
    </div>
  );
}
