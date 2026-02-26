import {
  createProductsQueryOptions,
  useProducts,
} from "@/features/inventory/products/products.queries";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/products/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(createProductsQueryOptions()),
  component: ProductsPage,
});

function ProductsPage() {
  const { data: products } = useProducts();

  return (
    <div>
      <p>Hello "/_authed/dashboard/products/"!</p>
      <div className="text-black">
        {products?.map((product) => (
          <div className="flex gap-10 items-center">
            <p key={product.id}>{product.name}</p>
            <Link
              to={`/dashboard/inventory-items/new/$productId`}
              params={{ productId: product.id }}
            >
              add inventory item
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
