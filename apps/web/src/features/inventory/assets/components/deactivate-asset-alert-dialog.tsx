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
import { useDeactivateAsset } from "../assets.queries";

interface DeactivateAssetAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetResponseDto | null;
}

export function DeactivateAssetAlertDialog({
  open,
  onOpenChange,
  asset,
}: DeactivateAssetAlertDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: deactivateAsset, isPending } = useDeactivateAsset();

  if (!asset) {
    return null;
  }

  async function handleDeactivate() {
    if (!asset) {
      return;
    }

    setErrorMessage(null);

    try {
      await deactivateAsset({ assetId: asset.id });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ProblemDetailsError) {
        setErrorMessage(
          error.problemDetails.detail ??
            error.problemDetails.title ??
            "No se pudo desactivar el asset.",
        );
        return;
      }

      setErrorMessage("Ocurrio un error al desactivar el asset.");
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
          <AlertDialogTitle>Desactivar asset</AlertDialogTitle>
          <AlertDialogDescription>
            Al desactivar este asset, deja de estar disponible para reservas de
            clientes. Seguira en tu catalogo, pero no podras usarlo
            operativamente hasta volver a activarlo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeactivate} disabled={isPending}>
            {isPending ? "Desactivando..." : "Desactivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
