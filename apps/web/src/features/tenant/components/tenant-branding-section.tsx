import { useUploadFile } from "@better-upload/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ImageOff, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildR2PublicUrl } from "@/lib/r2-public-url";
import { tenantQueries, useUpdateTenantBranding } from "../tenant.queries";

export function TenantBrandingSection() {
  const { data: tenant } = useSuspenseQuery(tenantQueries.me());
  const [failedLogoPath, setFailedLogoPath] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync: updateTenantBranding, isPending: isSaving } =
    useUpdateTenantBranding();

  const logoUrl = tenant.logoUrl;
  const previewUrl = buildR2PublicUrl(logoUrl, "branding");
  const showPreview = Boolean(previewUrl && failedLogoPath !== logoUrl);

  async function persistLogo(logoPath: string | null) {
    setErrorMessage(null);
    setFeedbackMessage(null);

    try {
      await updateTenantBranding({ logoUrl: logoPath });
      setFailedLogoPath(null);
      setFeedbackMessage(
        logoPath
          ? "Logo guardado correctamente."
          : "Logo eliminado correctamente.",
      );
    } catch (error) {
      setErrorMessage(getMutationErrorMessage(error));
    }
  }

  const { upload, isPending: isUploading } = useUploadFile({
    api: "/api/branding-upload",
    route: "brandingLogo",
    onBeforeUpload: async ({ file }) => {
      setErrorMessage(null);
      setFeedbackMessage(null);
      setFailedLogoPath(null);

      const { default: imageCompression } =
        await import("browser-image-compression");

      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        fileType: "image/webp",
        initialQuality: 0.82,
        maxSizeMB: 3,
      });

      return new File([compressed], file.name.replace(/\.[^.]+$/, ".webp"), {
        type: "image/webp",
      });
    },
    onUploadComplete: ({ file }) => {
      void persistLogo(file.objectInfo.key);
    },
    onError: (error) => {
      setErrorMessage(getUploadErrorMessage(error));
    },
  });

  const isBusy = isUploading || isSaving;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Branding</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube el logo que quieres mostrar en la experiencia del cliente.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
              {showPreview ? (
                <img
                  key={logoUrl ?? "empty-logo"}
                  src={previewUrl ?? undefined}
                  alt={`${tenant.name} logo`}
                  className="h-full w-full object-contain"
                  onError={() => {
                    if (logoUrl) {
                      setFailedLogoPath(logoUrl);
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                  <ImageOff className="h-5 w-5" />
                  <p className="text-xs font-medium">
                    {logoUrl
                      ? "No pudimos mostrar el logo actual."
                      : "Aun no hay logo cargado."}
                  </p>
                </div>
              )}
            </div>

            {feedbackMessage ? (
              <p className="text-sm text-emerald-600">{feedbackMessage}</p>
            ) : null}
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 size-0 opacity-0"
                disabled={isBusy}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    upload(file);
                  }
                  event.target.value = "";
                }}
              />
              {isUploading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{isUploading ? "Subiendo..." : "Subir logo"}</span>
            </label>

            <Button
              type="button"
              variant="outline"
              disabled={!logoUrl || isBusy}
              onClick={() => {
                void persistLogo(null);
              }}
            >
              {isSaving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span>{isSaving ? "Guardando..." : "Eliminar logo"}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const FILE_TOO_LARGE_MESSAGE =
  "El logo debe pesar menos de 3MB después de la compresión.";
const GENERIC_UPLOAD_ERROR_MESSAGE =
  "No pudimos subir el logo. Intenta nuevamente.";
const GENERIC_SAVE_ERROR_MESSAGE =
  "No pudimos guardar el logo. Intenta nuevamente.";

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("size")) {
      return FILE_TOO_LARGE_MESSAGE;
    }

    return error.message;
  }

  return GENERIC_UPLOAD_ERROR_MESSAGE;
}

function getMutationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return GENERIC_SAVE_ERROR_MESSAGE;
}
