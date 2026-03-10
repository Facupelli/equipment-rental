import { useUploadFile } from "@better-upload/client";

type Props = {
  onUploadComplete: (path: string) => void;
  currentPath?: string | null;
};

export function CatalogImageUploader({ onUploadComplete, currentPath }: Props) {
  const { upload, isPending, isSuccess, isError } = useUploadFile({
    route: "catalogImages",
    onBeforeUpload: async ({ file }) => {
      const { default: imageCompression } =
        await import("browser-image-compression");

      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        fileType: "image/webp",
        initialQuality: 0.82,
        maxSizeMB: 3,
      });

      // browser-image-compression returns a Blob — wrap it back into a File
      return new File([compressed], file.name.replace(/\.[^.]+$/, ".webp"), {
        type: "image/webp",
      });
    },
    onUploadComplete: ({ file }) => {
      onUploadComplete(file.objectInfo.key);
    },
  });

  const previewUrl = currentPath
    ? `${import.meta.env.VITE_R2_PUBLIC_URL}/${currentPath}`
    : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Current image preview */}
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Current image"
          className="h-40 w-40 rounded-md object-cover"
        />
      )}

      {/* Upload trigger */}
      <label className="relative inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed">
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 size-0 opacity-0"
          disabled={isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        {isPending ? "Uploading…" : "Upload image"}
      </label>

      {isSuccess && (
        <p className="text-sm text-green-600">Image uploaded successfully.</p>
      )}
      {isError && (
        <p className="text-sm text-red-500">Upload failed. Please try again.</p>
      )}
    </div>
  );
}
