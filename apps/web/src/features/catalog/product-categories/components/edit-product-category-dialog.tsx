import type { ProductCategoryResponse } from "@repo/schemas";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateCategory } from "@/features/catalog/product-categories/categories.queries";
import {
	productCategoryToFormValues,
	toUpdateProductCategoryDto,
} from "@/features/catalog/product-categories/schemas/product-categories-form.schema";
import { ProductCategoryForm } from "./product-category-form";

interface EditProductCategoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category: ProductCategoryResponse | null;
}

const formId = "edit-category";

export function EditProductCategoryDialog({
	open,
	onOpenChange,
	category,
}: EditProductCategoryDialogProps) {
	const { mutateAsync: updateCategory, isPending } = useUpdateCategory();

	if (!category) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Category</DialogTitle>
					<DialogDescription>
						Update the category details used to organize your inventory.
					</DialogDescription>
				</DialogHeader>

				{open && (
					<ProductCategoryForm
						key={category.id}
						formId={formId}
						defaultValues={productCategoryToFormValues(category)}
						onCancel={() => onOpenChange(false)}
						isPending={isPending}
						submitLabel="Save Changes"
						pendingLabel="Saving..."
						onSubmit={async ({ dirtyValues }) => {
							await updateCategory({
								categoryId: category.id,
								dto: toUpdateProductCategoryDto(dirtyValues),
							});
							onOpenChange(false);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
