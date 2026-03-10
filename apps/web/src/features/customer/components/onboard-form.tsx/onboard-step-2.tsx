import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { withForm } from "@/shared/contexts/form.context";
import { customerFormValues } from "../../schemas/onboard-form.schema";
import { ImageUploadField } from "@/shared/components/image-uploader";
import type { useUploadFiles } from "@better-upload/client";

export const Step2Document = withForm({
  defaultValues: customerFormValues,
  props: {
    isUploading: false,
    uploader: null as unknown as ReturnType<typeof useUploadFiles>,
  },
  render: ({ form, uploader }) => {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Documento y domicilio
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Subí una foto de tu documento y completá tu dirección.
          </p>
        </div>

        <FieldGroup>
          <form.Field name="identityDocumentFile">
            {(field) => (
              <ImageUploadField
                uploader={uploader}
                value={field.state.value}
                onChange={field.handleChange}
                id={field.name}
              />
            )}
          </form.Field>

          <form.Field name="address">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Domicilio real</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Av. Corrientes 1234, Piso 2"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="city">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Localidad</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Buenos Aires"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="stateRegion">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Provincia / Región
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Buenos Aires"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="country">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>País</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="Argentina"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>
        </FieldGroup>
      </div>
    );
  },
});
