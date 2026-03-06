import { useForm } from "@tanstack/react-form";
import { useCreateAsset } from "../assets.queries";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useOwners } from "@/features/tenant/owners/owners.queries";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useProduct } from "@/features/catalog/product-types/components/detail/product-detail.context";
import { TrackingMode } from "@repo/types";
import {
  assetFormDefaults,
  assetFormSchema,
  toCreateAssetDto,
} from "../schemas/asset-form.schema";

const formId = "create-asset";

export function CreateAssetDialogForm() {
  const { product } = useProduct();

  const [open, setOpen] = useState(false);

  const { mutate: createAsset, isPending } = useCreateAsset({
    onSuccess: () => setOpen(false),
  });
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: owners = [], isLoading: ownersLoading } = useOwners();

  const form = useForm({
    defaultValues: assetFormDefaults,
    validators: {
      onSubmit: assetFormSchema,
    },
    onSubmit: async ({ value }) => {
      const dto = toCreateAssetDto(value, product.id);
      createAsset(dto);
      form.reset();
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
          <DialogDescription>
            Add a new asset for {product.name}.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-8"
        >
          <FieldGroup>
            {/* Location Field */}
            <form.Field
              name="locationId"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Location</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        value && field.handleChange(value)
                      }
                      disabled={locationsLoading}
                      items={locations.map((l) => ({
                        value: l.id,
                        label: l.name,
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            locationsLoading
                              ? "Loading..."
                              : "Select a location"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Owner Field (optional) */}
            <form.Field
              name="ownerId"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Owner{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Select
                      value={field.state.value ?? ""}
                      onValueChange={(value) =>
                        value && field.handleChange(value)
                      }
                      disabled={ownersLoading}
                      items={owners.map((o) => ({
                        value: o.id,
                        label: o.name,
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            ownersLoading ? "Loading..." : "Select an owner"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Serial Number Field (optional) */}
            <form.Field
              name="serialNumber"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Serial Number{" "}
                      <span className="text-muted-foreground text-xs">
                        {product.trackingMode === TrackingMode.POOLED &&
                          "(optional)"}
                      </span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Notes Field (optional) */}
            <form.Field
              name="notes"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Notes{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSubmit}
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" form={formId} disabled={isPending}>
                  {isSubmitting || isPending ? "Creating..." : "Create Asset"}
                </Button>
              </div>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
