import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createProductsQueryOptions,
  useProducts,
} from "@/features/inventory/products/products.queries";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/inventory/products/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(createProductsQueryOptions()),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products } = useProducts();

  console.log({ products });

  return (
    <>
      <header className="flex items-center justify-between border-b gap-10 border-gray-200 bg-white p-6">
        <Input type="search" placeholder="Search" />

        <Button
          render={
            <Link to="/dashboard/inventory/products/new">CREATE PRODUCT</Link>
          }
        />
      </header>
      <div className="p-6">
        <p>Product Catalog</p>
        <div className="text-black">
          {products?.map((product) => (
            <div key={product.id} className="flex gap-10 items-center">
              <p>{product.name}</p>
              <Link
                to={`/dashboard/inventory/items/new/$productId`}
                params={{ productId: product.id }}
              >
                add inventory item
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
