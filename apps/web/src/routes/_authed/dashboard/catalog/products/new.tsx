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
import { useCategories } from "@/features/catalog/product-categories/categories.queries";
import { useCreateProduct } from "@/features/catalog/product-types/products.queries";
import { ProductTypeCreateSchema } from "@repo/schemas";
import { TrackingMode } from "@repo/types";
import { useForm } from "@tanstack/react-form";
import { getRouteApi } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute(
  "/_authed/dashboard/catalog/products/new",
)({
  component: CreateProductPage,
});

const authedRoute = getRouteApi("/_authed");

const formId = "create-product";

function CreateProductPage() {
  const {
    tenant: { billingUnits },
  } = authedRoute.useLoaderData();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { mutate: createProduct, isPending } = useCreateProduct();

  const form = useForm({
    defaultValues: {
      categoryId: "",
      billingUnitId: "",
      name: "",
      description: "",
      trackingMode: undefined as unknown as TrackingMode,
      attributes: {} as Record<string, string>,
      includedItems: [] as any[],
      pricingTiers: [] as {
        productTypeId?: string | null;
        bundleId: string | null;
        locationId: string | null;
        fromUnit: number;
        toUnit: number | null;
        pricePerUnit: number;
      }[],
    },
    validators: {
      onChange: ProductTypeCreateSchema,
    },
    onSubmit: async ({ value }) => {
      createProduct({ ...value, isActive: true });
    },
  });

  return (
    <div className="grid place-items-center pt-10">
      <Card className="w-full sm:max-w-2xl">
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
          <CardDescription>
            Add a new product to your inventory.
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
              {/* Category Field */}
              <form.Field
                name="categoryId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          value && field.handleChange(value)
                        }
                        disabled={categoriesLoading}
                        items={categories.map((l) => ({
                          value: l.id,
                          label: l.name,
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              categoriesLoading
                                ? "Loading..."
                                : "Select a category"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
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

              {/* Billing Unit Field */}
              <form.Field
                name="billingUnitId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Billing Unit</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          value && field.handleChange(value)
                        }
                        items={billingUnits.map((unit) => ({
                          value: unit.id,
                          label: unit.label,
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a billing unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {billingUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.label}
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

              {/* Name Field */}
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Product Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        type="text"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              {/* Description Field */}
              <form.Field
                name="description"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Description{" "}
                        <span className="text-muted-foreground text-xs">
                          (optional)
                        </span>
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        type="text"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              {/* Tracking Mode Field */}
              <form.Field
                name="trackingMode"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Tracking Mode
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as TrackingMode)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tracking mode" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TrackingMode).map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode}
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

              {/* Attributes Field (Dynamic Key-Value) */}
              <div className="space-y-2">
                <FieldLabel>Attributes</FieldLabel>
                <form.Field
                  name="attributes"
                  children={(field) => {
                    const entries = Object.entries(field.state.value);
                    return (
                      <div className="space-y-2">
                        {entries.map(([key, value], idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <Input
                              placeholder="Key"
                              value={key}
                              onChange={(e) => {
                                const newKey = e.target.value;
                                const newState = { ...field.state.value };
                                if (newKey !== key) {
                                  delete newState[key];
                                  newState[newKey] = value;
                                  field.handleChange(newState);
                                }
                              }}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Value"
                              value={value}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.handleChange({
                                  ...field.state.value,
                                  [key]: val,
                                });
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newState = { ...field.state.value };
                                delete newState[key];
                                field.handleChange(newState);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            field.handleChange({
                              ...field.state.value,
                              [`new_key_${Date.now()}`]: ``,
                            })
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Attribute
                        </Button>
                      </div>
                    );
                  }}
                />
              </div>

              {/* Included Items Field (Array) */}
              <div className="space-y-2">
                <FieldLabel>Included Items</FieldLabel>
                <form.Field
                  name="includedItems"
                  mode="array"
                  children={(field) => (
                    <div className="space-y-4">
                      {field.state.value.map((_, index) => (
                        <div
                          key={index}
                          className="border p-4 rounded-md space-y-4 relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => field.removeValue(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <form.Field
                            name={`includedItems[${index}].name`}
                            children={(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel>Name</FieldLabel>
                                  <Input
                                    type="text"
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                    aria-invalid={isInvalid}
                                  />
                                  {isInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />

                          <form.Field
                            name={`includedItems[${index}].quantity`}
                            children={(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel>Quantity</FieldLabel>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value),
                                      )
                                    }
                                    aria-invalid={isInvalid}
                                  />
                                  {isInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />

                          <form.Field
                            name={`includedItems[${index}].notes`}
                            children={(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel>
                                    Notes{" "}
                                    <span className="text-muted-foreground text-xs">
                                      (optional)
                                    </span>
                                  </FieldLabel>
                                  <Input
                                    type="text"
                                    value={subField.state.value ?? ""}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value)
                                    }
                                    aria-invalid={isInvalid}
                                  />
                                  {isInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          field.pushValue({
                            name: "",
                            quantity: 1,
                            notes: "",
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Included Item
                      </Button>
                    </div>
                  )}
                />
              </div>

              {/* Pricing Tiers Field (Array) */}
              <div className="space-y-2">
                <FieldLabel>Pricing Tiers</FieldLabel>
                <form.Field
                  name="pricingTiers"
                  mode="array"
                  children={(field) => (
                    <div className="space-y-4">
                      {field.state.value.map((_, index) => (
                        <div
                          key={index}
                          className="border p-4 rounded-md space-y-4 relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => field.removeValue(index)}
                            disabled={field.state.value.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <form.Field
                            name={`pricingTiers[${index}].fromUnit`}
                            children={(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel>From unit</FieldLabel>
                                  <Input
                                    type="number"
                                    value={subField.state.value}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value),
                                      )
                                    }
                                    onBlur={subField.handleBlur}
                                  />
                                  {isInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />

                          <form.Field
                            name={`pricingTiers[${index}].toUnit`}
                            children={(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel>
                                    To unit{" "}
                                    <span className="text-muted-foreground text-xs">
                                      (optional)
                                    </span>
                                  </FieldLabel>
                                  <Input
                                    type="number"
                                    value={subField.state.value ?? ""}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        e.target.value === ""
                                          ? null
                                          : Number(e.target.value),
                                      )
                                    }
                                    onBlur={subField.handleBlur}
                                  />
                                  {isInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />

                          <form.Field
                            name={`pricingTiers[${index}].pricePerUnit`}
                            children={(subField) => {
                              const isInvalid =
                                subField.state.meta.isTouched &&
                                !subField.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel>Price per unit</FieldLabel>
                                  <Input
                                    type="number"
                                    value={subField.state.value}
                                    onChange={(e) =>
                                      subField.handleChange(
                                        Number(e.target.value),
                                      )
                                    }
                                    onBlur={subField.handleBlur}
                                  />
                                  {isInvalid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />
                        </div>
                      ))}

                      {field.state.meta.isTouched &&
                        !field.state.meta.isValid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          field.pushValue({
                            fromUnit: 0,
                            toUnit: null,
                            pricePerUnit: 0,
                            locationId: null,
                            bundleId: null,
                          })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Pricing Tier
                      </Button>
                    </div>
                  )}
                />
              </div>
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
                  {isSubmitting || isPending ? "Creating..." : "Create Product"}
                </Button>
              </div>
            )}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
