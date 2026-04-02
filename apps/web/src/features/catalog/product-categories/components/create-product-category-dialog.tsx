import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateCategory } from "@/features/catalog/product-categories/categories.queries";
import {
	productCategoryFormDefaults,
	toCreateProductCategoryDto,
} from "@/features/catalog/product-categories/schemas/product-categories-form.schema";
import { ProductCategoryForm } from "./product-category-form";

const formId = "create-category";

export function CreateProductCategoryDialog() {
	const [open, setOpen] = useState(false);
	const { mutateAsync: createCategory, isPending } = useCreateCategory();

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Agregar categoria
					</Button>
				}
			/>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Crear categoria</DialogTitle>
					<DialogDescription>
						Agrega una nueva categoria para organizar tus productos.
					</DialogDescription>
				</DialogHeader>

				{open && (
					<ProductCategoryForm
						formId={formId}
						defaultValues={productCategoryFormDefaults}
						onCancel={() => setOpen(false)}
						isPending={isPending}
						submitLabel="Crear"
						pendingLabel="Creando..."
						onSubmit={async ({ values }) => {
							await createCategory(toCreateProductCategoryDto(values));
							setOpen(false);
						}}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
