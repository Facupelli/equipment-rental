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
import { useCreateProduct } from "@/features/products/products.queries";
import { createProductSchema, type CreatePricingTierDto } from "@repo/schemas";
import { TrackingType } from "@repo/types";
import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard/products/new")({
  component: CreateProductPage,
});

const formId = "create-product";

function CreateProductPage() {
  const {
    tenant: { billingUnits },
  } = Route.useRouteContext();
  const { mutate: createProduct, isPending } = useCreateProduct();

  const form = useForm({
    defaultValues: {
      name: "",
      trackingType: undefined as unknown as TrackingType,
      attributes: {} as Record<string, string>,
      pricingTiers: [] as CreatePricingTierDto[],
    },
    validators: {
      onChange: createProductSchema,
    },
    onSubmit: async ({ value }) => {
      createProduct({ data: value });
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

              {/* Tracking Type Field (Select) */}
              <form.Field
                name="trackingType"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Tracking Type
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as TrackingType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TrackingType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
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
                                // Rename key logic
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
                              [`new_key_${Date.now()}`]: "",
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
                            name={`pricingTiers[${index}].billingUnitId`}
                            children={(field) => {
                              const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel htmlFor={field.name}>
                                    Billing unit
                                  </FieldLabel>
                                  <Select
                                    value={field.state.value}
                                    onValueChange={(value) => {
                                      if (!value) {
                                        return;
                                      }
                                      field.handleChange(value);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {billingUnits.map((unit) => (
                                        <SelectItem
                                          key={unit.id}
                                          value={unit.id}
                                        >
                                          {unit.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {isInvalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />

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
                                      subField.handleChange(e.target.value)
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
                                      subField.handleChange(e.target.value)
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
                            name={`pricingTiers[${index}].currency`}
                            children={(field) => {
                              const isInvalid =
                                field.state.meta.isTouched &&
                                !field.state.meta.isValid;
                              return (
                                <Field data-invalid={isInvalid}>
                                  <FieldLabel htmlFor={field.name}>
                                    Currency
                                  </FieldLabel>
                                  <Select
                                    value={field.state.value}
                                    onValueChange={(value) => {
                                      if (!value) {
                                        return;
                                      }
                                      field.handleChange(value);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={"ARS"}>ARS</SelectItem>
                                      <SelectItem value={"USD"}>USD</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {isInvalid && (
                                    <FieldError
                                      errors={field.state.meta.errors}
                                    />
                                  )}
                                </Field>
                              );
                            }}
                          />
                        </div>
                      ))}

                      {/* Validation error for the whole array (e.g. min 1 item) */}
                      {field.state.meta.isTouched &&
                        !field.state.meta.isValid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          field.pushValue({
                            billingUnitId: "",
                            fromUnit: 0,
                            pricePerUnit: 0,
                            currency: "ARS",
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
