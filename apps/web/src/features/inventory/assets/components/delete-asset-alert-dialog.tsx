import type { AssetResponseDto } from "@repo/schemas";
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
import { ProblemDetailsError } from "@/shared/errors";
import { useDeleteAsset } from "../assets.queries";

interface DeleteAssetAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetResponseDto | null;
}

export function DeleteAssetAlertDialog({
  open,
  onOpenChange,
  asset,
}: DeleteAssetAlertDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: deleteAsset, isPending } = useDeleteAsset();

  if (!asset) {
    return null;
  }

  async function handleDelete() {
    if (!asset) {
      return;
    }

    setErrorMessage(null);

    try {
      await deleteAsset({ assetId: asset.id });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ProblemDetailsError) {
        setErrorMessage(
          error.problemDetails.detail ??
            error.problemDetails.title ??
            "No se pudo eliminar el asset.",
        );
        return;
      }

      setErrorMessage("Ocurrio un error al eliminar el asset.");
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setErrorMessage(null);
        }
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar asset</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a eliminar por completo este asset del catalogo. Esta accion lo
            remueve definitivamente y no se puede deshacer.
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
