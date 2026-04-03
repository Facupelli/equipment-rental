import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCategories } from "@/features/catalog/product-categories/categories.queries";
import { ProductTypeForm } from "@/features/catalog/product-types/components/product-type-form";
import { useCreateProduct } from "@/features/catalog/product-types/product.mutations";
import {
  productTypeFormDefaults,
  toCreateProductTypeDto,
} from "@/features/catalog/product-types/schemas/product-type-form.schema";
import { tenantQueries } from "@/features/tenant/tenant.queries";

export const Route = createFileRoute("/_admin/dashboard/catalog/products/new")({
  component: CreateProductPage,
});

const formId = "create-product-type";

function CreateProductPage() {
  const navigate = useNavigate();
  const {
    data: { billingUnits },
  } = useSuspenseQuery(tenantQueries.me());
  const { data: categories = [] } = useCategories();
  const { mutateAsync: createProduct, isPending } = useCreateProduct();

  return (
    <div className="grid place-items-center py-10">
      <Card className="w-full sm:max-w-2xl">
        <CardHeader>
          <CardTitle>Crear producto</CardTitle>
          <CardDescription>
            Agrega un nuevo producto al catalogo de tu inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductTypeForm
            formId={formId}
            defaultValues={productTypeFormDefaults}
            categories={categories}
            billingUnits={billingUnits}
            onCancel={() => navigate({ to: "/dashboard/catalog/products" })}
            isPending={isPending}
            submitLabel="Crear producto"
            pendingLabel="Creando..."
            cancelLabel="Cancelar"
            onSubmit={async ({ values }) => {
              const productTypeId = await createProduct(
                toCreateProductTypeDto(values),
              );
              navigate({
                to: "/dashboard/catalog/products/$productId",
                params: { productId: productTypeId },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
