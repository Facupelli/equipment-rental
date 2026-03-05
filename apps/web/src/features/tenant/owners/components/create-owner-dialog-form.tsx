import { useCreateOwner } from "@/features/tenant/owners/owners.queries";
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
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
import {
  ownerFormDefaults,
  ownerFormSchema,
  toCreateOwnerDto,
} from "../schemas/owner-form.schema";

interface CreateOwnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formId = "create-owner";

export function CreateOwnerDialog({
  open,
  onOpenChange,
}: CreateOwnerDialogProps) {
  const { mutate: createOwner, isPending } = useCreateOwner({
    onSuccess: () => onOpenChange(false),
  });

  const form = useForm({
    defaultValues: ownerFormDefaults,
    validators: {
      onSubmit: ownerFormSchema,
    },
    onSubmit: async ({ value }) => {
      const dto = toCreateOwnerDto(value);
      createOwner(dto);
    },
  });

  function handleOpenChange(nextOpen: boolean) {
    form.reset();
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Owner</DialogTitle>
          <DialogDescription>
            Create a new external entity to own rental inventory.
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Owner Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="e.g. Acme Holdings Ltd."
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
                  {isSubmitting || isPending ? "Creating..." : "Create Owner"}
                </Button>
              </>
            )}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
