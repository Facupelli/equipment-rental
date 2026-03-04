import { useCreateLocation } from "@/features/tenant/locations/locations.queries";
import { LocationCreateSchema } from "@repo/schemas";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface CreateLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formId = "create-location";

export function CreateLocationDialog({
  open,
  onOpenChange,
}: CreateLocationDialogProps) {
  const { mutate: createLocation, isPending } = useCreateLocation({
    onSuccess: () => onOpenChange(false),
    onError: (error) => {
      console.error({ error });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      address: "",
      isActive: true,
    },
    validators: {
      onChange: LocationCreateSchema,
    },
    onSubmit: async ({ value }) => {
      createLocation(value);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    form.reset();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Location</DialogTitle>
          <DialogDescription>
            Register a new site for storing and managing rental inventory.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          {/* Name */}
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Location Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="e.g. Manhattan Distribution Hub"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>

          {/* Address */}
          <FieldGroup>
            <form.Field
              name="address"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Street</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="450 W 33rd St"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>

          {/* isActive */}
          <form.Field
            name="isActive"
            children={(field) => (
              <Field orientation="horizontal">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <FieldLabel htmlFor={field.name}>
                  Set as active on creation
                </FieldLabel>
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form={formId}
                  disabled={!canSubmit || isPending}
                >
                  {isSubmitting || isPending
                    ? "Creating..."
                    : "Create Location"}
                </Button>
              </>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
