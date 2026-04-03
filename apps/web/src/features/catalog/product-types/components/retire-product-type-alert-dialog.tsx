import type { ProductTypeResponse } from "@repo/schemas";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRetireProductType } from "@/features/catalog/product-types/product.mutations";
import { ProblemDetailsError } from "@/shared/errors";

interface RetireProductTypeAlertDialogProps {
  product: ProductTypeResponse;
}

export function RetireProductTypeAlertDialog({
  product,
}: RetireProductTypeAlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: retireProductType, isPending } = useRetireProductType();

  async function handleRetire() {
    setErrorMessage(null);

    try {
      await retireProductType({ productTypeId: product.id });
      setOpen(false);
    } catch (error) {
      if (error instanceof ProblemDetailsError) {
        setErrorMessage(getErrorMessage(error));
        return;
      }

      setErrorMessage("Ocurrio un error al retirar el producto.");
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="outline" disabled={isPending}>
            {isPending ? "Retirando..." : "Retirar"}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirar producto</AlertDialogTitle>
          <AlertDialogDescription>
            Estas por retirar el producto "{product.name}". Dejará de estar
            disponible en el catálogo de alquiler y esta acción no se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleRetire}
            disabled={isPending}
          >
            {isPending ? "Retirando..." : "Retirar producto"}
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
    "No se pudo retirar el producto."
  );
}
