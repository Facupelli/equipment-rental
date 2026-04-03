import type { ProductTypeResponse } from "@repo/schemas";
import { Loader2, Plus, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/features/catalog/product-types/products.queries";
import useDebounce from "@/shared/hooks/use-debounce";

interface BundleProductSearchProps {
	addedIds: Set<string>;
	onAdd: (product: ProductTypeResponse) => void;
}

export function BundleProductSearch({
	addedIds,
	onAdd,
}: BundleProductSearchProps) {
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebounce(search, 300);

	const { data: products, isFetching } = useProducts({
		search: debouncedSearch || undefined,
		isActive: true,
	});

	const results = products?.data ?? [];

	return (
		<div className="space-y-2">
			<div className="relative">
				<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
				{isFetching && (
					<Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
				)}
				<Input
					placeholder="Buscar productos..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-9"
				/>
			</div>

			{results.length > 0 && (
				<div className="border-border divide-border divide-y rounded-lg border">
					{results.map((product) => {
						const isAdded = addedIds.has(product.id);
						const price = product.pricingTiers[0]?.pricePerUnit;

						return (
							<div
								key={product.id}
								className="flex items-center gap-3 px-3 py-2.5"
							>
								<div className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
									<span className="text-muted-foreground text-xs font-medium uppercase">
										{product.name.slice(0, 2)}
									</span>
								</div>

								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">{product.name}</p>
									<p className="text-muted-foreground text-xs">
										{product.category?.name && (
											<span>{product.category.name} · </span>
										)}
										{price != null ? price : "Sin precio"}
									</p>
								</div>

								<button
									type="button"
									onClick={() => !isAdded && onAdd(product)}
									disabled={isAdded}
									className={
										isAdded
											? "text-muted-foreground cursor-default text-xs"
											: "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
									}
								>
									{isAdded ? (
										"Agregado"
									) : (
										<>
											<Plus className="size-3" />
											Agregar
										</>
									)}
								</button>
							</div>
						);
					})}
				</div>
			)}

			{debouncedSearch && results.length === 0 && !isFetching && (
				<p className="text-muted-foreground py-4 text-center text-sm">
					No se encontraron productos para &quot;{debouncedSearch}&quot;
				</p>
			)}
		</div>
	);
}
