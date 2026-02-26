import {
  createProductsQueryOptions,
  useProducts,
} from "@/features/products/products.queries";
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
          <p key={product.id}>{product.name}</p>
        ))}
      </div>
    </div>
  );
}
