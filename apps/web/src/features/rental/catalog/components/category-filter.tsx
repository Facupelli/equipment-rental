import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/features/catalog/product-categories/categories.queries";

interface CategoryFilterProps {
  activeCategory: string | undefined;
  onSelect: (id: string) => void;
}

export function CategoryFilter({
  activeCategory,
  onSelect,
}: CategoryFilterProps) {
  const { data: categories, isFetching } = useCategories();

  if (isFetching) {
    return (
      <div className="hidden md:flex gap-2 pb-4 border-b">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  if (!categories?.length) {
    return null;
  }

  return (
    <div className="hidden md:flex gap-2 pb-4 overflow-x-auto border-b scrollbar-hide">
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={activeCategory === cat.id ? "default" : "ghost"}
          onClick={() => onSelect(cat.id)}
          className="rounded-full shrink-0"
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
