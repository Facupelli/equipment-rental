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
import { CatalogImageUploader } from "@/features/catalog/components/catalog-image-uploader";
import { useCategories } from "@/features/catalog/product-categories/categories.queries";
import { useCreateProduct } from "@/features/catalog/product-types/product.mutations";
import {
  productTypeFormDefaults,
  productTypeFormSchema,
  toCreateProductTypeDto,
} from "@/features/catalog/product-types/schemas/product-type-form.schema";
import { TrackingMode } from "@repo/types";
import { useForm } from "@tanstack/react-form";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_admin/dashboard/catalog/products/new")({
  component: CreateProductPage,
});

const authedRoute = getRouteApi("/_admin/dashboard");

const formId = "create-product";

function CreateProductPage() {
  const navigate = useNavigate();

  const {
    tenant: { billingUnits },
  } = authedRoute.useLoaderData();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();
  const { mutateAsync: createProduct, isPending } = useCreateProduct();

  const form = useForm({
    defaultValues: productTypeFormDefaults,
    validators: {
      onChange: productTypeFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const dto = toCreateProductTypeDto(value);
        createProduct(dto);
        navigate({ to: "/dashboard/catalog/products" });
      } catch (error) {
        console.log({ error });
      }
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
                          field.handleChange(value ?? "")
                        }
                        disabled={categoriesLoading}
                        items={categories.map((c) => ({
                          value: c.id,
                          label: c.name,
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

              <form.Field
                name="imageUrl"
                children={(field) => (
                  <Field>
                    <FieldLabel>
                      Product Image{" "}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </FieldLabel>
                    <CatalogImageUploader
                      currentPath={field.state.value}
                      onUploadComplete={(path) => field.handleChange(path)}
                    />
                  </Field>
                )}
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

              {/* Attributes Field (Dynamic Key-Value rows) */}
              <div className="space-y-2">
                <FieldLabel>Attributes</FieldLabel>
                <form.Field
                  name="attributes"
                  mode="array"
                  children={(field) => (
                    <div className="space-y-2">
                      {field.state.value.map((_, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <form.Field
                            name={`attributes[${index}].key`}
                            children={(subField) => (
                              <Field className="flex-1">
                                <Input
                                  placeholder="Key"
                                  value={subField.state.value}
                                  onBlur={subField.handleBlur}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                                {subField.state.meta.isTouched &&
                                  !subField.state.meta.isValid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                              </Field>
                            )}
                          />
                          <form.Field
                            name={`attributes[${index}].value`}
                            children={(subField) => (
                              <Field className="flex-1">
                                <Input
                                  placeholder="Value"
                                  value={subField.state.value}
                                  onBlur={subField.handleBlur}
                                  onChange={(e) =>
                                    subField.handleChange(e.target.value)
                                  }
                                />
                                {subField.state.meta.isTouched &&
                                  !subField.state.meta.isValid && (
                                    <FieldError
                                      errors={subField.state.meta.errors}
                                    />
                                  )}
                              </Field>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => field.removeValue(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => field.pushValue({ key: "", value: "" })}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Attribute
                      </Button>
                    </div>
                  )}
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
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          field.pushValue({ name: "", quantity: 1, notes: "" })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Included Item
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
