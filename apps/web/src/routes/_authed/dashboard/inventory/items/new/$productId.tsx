import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAsset } from "@/features/inventory/assets/assets.queries";
import { useLocations } from "@/features/tenant/locations/locations.queries";
import { useOwners } from "@/features/tenant/owners/owners.queries";
import { AssetCreateSchema } from "@repo/schemas";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authed/dashboard/inventory/items/new/$productId",
)({
  component: CreateInventoryItemPage,
});

const formId = "create-asset";

function CreateInventoryItemPage() {
  const { productId } = Route.useParams();
  const { mutate: createAsset, isPending } = useCreateAsset();
  const { data: locations = [], isLoading: locationsLoading } = useLocations();
  const { data: owners = [], isLoading: ownersLoading } = useOwners();

  const form = useForm({
    defaultValues: {
      locationId: "",
      ownerId: "",
      serialNumber: "",
      notes: "",
    },
    validators: {
      onChange: AssetCreateSchema.omit({ productTypeId: true }),
    },
    onSubmit: async ({ value }) => {
      createAsset({
        ...value,
        productTypeId: productId,
        isActive: true,
      });
    },
  });

  return (
    <div className="grid place-items-center pt-10">
      <Card className="w-full sm:max-w-2xl">
        <CardHeader>
          <CardTitle>Create Inventory Item</CardTitle>
          <CardDescription>
            Register a new item into your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
        <CardFooter>
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
                  {isSubmitting || isPending
                    ? "Creating..."
                    : "Create Inventory Item"}
                </Button>
              </div>
            )}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
