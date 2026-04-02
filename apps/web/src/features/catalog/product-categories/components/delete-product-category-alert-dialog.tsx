import type { ProductCategoryResponse } from "@repo/schemas";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteCategory } from "@/features/catalog/product-categories/categories.queries";
import { ProblemDetailsError } from "@/shared/errors";

interface DeleteProductCategoryAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ProductCategoryResponse | null;
}

export function DeleteProductCategoryAlertDialog({
  open,
  onOpenChange,
  category,
}: DeleteProductCategoryAlertDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: deleteCategory, isPending } = useDeleteCategory();

  if (!category) {
    return null;
  }

  const categoryId = category.id;
  const categoryName = category.name;

  async function handleDelete() {
    setErrorMessage(null);

    try {
      await deleteCategory({ categoryId });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ProblemDetailsError) {
        setErrorMessage(getErrorMessage(error));
        return;
      }
      setErrorMessage("Ha ocurrido un error al eliminar la categoria.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar categoria</AlertDialogTitle>
          <AlertDialogDescription>
            Estas por eliminar la categoria "{categoryName}". Esta acción no se
            puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getErrorMessage(error: ProblemDetailsError) {
  return (
    error.problemDetails.detail ??
    error.problemDetails.title ??
    "No se pudo eliminar la categoría."
  );
}
