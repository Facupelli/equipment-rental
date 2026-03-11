import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Mail, Lock, UserCircle2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  customerRegisterDefaultValues,
  customerRegisterSchema,
} from "@/features/rental/auth/register/customer-register-form.schema";
import { useCustomerRegister } from "@/features/rental/auth/portal-auth.queries";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_portal/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { tenantContext } = Route.useRouteContext();
  const { mutateAsync: register } = useCustomerRegister();

  const form = useForm({
    defaultValues: customerRegisterDefaultValues,
    validators: {
      onSubmit: customerRegisterSchema,
    },
    onSubmit: async ({ value }) => {
      if (tenantContext.face !== "portal") {
        return;
      }

      try {
        await register({
          ...value,
          tenantId: tenantContext.tenant.id,
        });
        form.reset();
      } catch (error) {
        console.log({ error });
      }
    },
  });

  console.log(form.getAllErrors());

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Create an account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Join the premier equipment rental network
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-md rounded-xl bg-neutral-800 border border-white/5 p-8 shadow-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            noValidate
          >
            <FieldGroup>
              {/* ── First name / Last name ── */}
              <div className="grid grid-cols-2 gap-4">
                <form.Field
                  name="firstName"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-sm font-medium text-zinc-200"
                        >
                          First Name
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          placeholder="John"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="bg-neutral-800 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name="lastName"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-sm font-medium text-zinc-200"
                        >
                          Last Name
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="text"
                          placeholder="Doe"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="bg-neutral-800 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </div>

              {/* ── Email ── */}
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-sm font-medium text-zinc-200"
                      >
                        Email Address
                      </FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          placeholder="name@company.com"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="pl-9 bg-neutral-800 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                        />
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              {/* ── Password ── */}
              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-sm font-medium text-zinc-200"
                      >
                        Password
                      </FieldLabel>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          placeholder="••••••••"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="pl-9 bg-neutral-800 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                        />
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              {/* ── Is company checkbox ── */}
              <form.Field
                name="isCompany"
                children={(field) => (
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.handleChange(checked === true);
                        // Reset companyName when unchecking so stale
                        // values don't linger and superRefine stays clean
                        if (checked !== true) {
                          form.setFieldValue("companyName", null);
                        }
                      }}
                      className="border-white/20 data-[state=checked]:bg-neutral-600 data-[state=checked]:border-neutral-600"
                    />
                    <label
                      htmlFor={field.name}
                      className="text-sm text-zinc-400 cursor-pointer select-none"
                    >
                      Register as a Company
                    </label>
                  </div>
                )}
              />

              {/* ── Company name (conditional) ── */}
              <form.Subscribe
                selector={(state) => state.values.isCompany}
                children={(isCompany) =>
                  isCompany ? (
                    <form.Field
                      name="companyName"
                      children={(field) => {
                        const isInvalid =
                          field.state.meta.isTouched &&
                          !field.state.meta.isValid;

                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel
                              htmlFor={field.name}
                              className="text-sm font-medium text-zinc-200"
                            >
                              Company Name
                            </FieldLabel>
                            <div className="relative">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                              <Input
                                id={field.name}
                                name={field.name}
                                type="text"
                                placeholder="Acme Corp"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                className="pl-9 bg-neutral-800 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-neutral-600 focus-visible:border-neutral-600"
                              />
                            </div>
                            {isInvalid && (
                              <FieldError errors={field.state.meta.errors} />
                            )}
                          </Field>
                        );
                      }}
                    />
                  ) : null
                }
              />
            </FieldGroup>

            {/* ── Submit ── */}
            <form.Subscribe
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-white text-black font-semibold hover:bg-zinc-100 transition-colors"
                >
                  {isSubmitting ? "Creating account…" : "Create Account →"}
                </Button>
              )}
            />

            {/* ── Divider ── */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-neutral-800 px-3 text-[11px] uppercase tracking-widest text-zinc-600">
                  or join with
                </span>
              </div>
            </div>

            {/* ── SSO ── */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <UserCircle2 className="mr-2 size-4" />
              Single Sign-On (SSO)
            </Button>
          </form>
        </div>

        {/* ── Sign in link ── */}
        <p className="mt-6 text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold hover:text-neutral-300 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </main>

      {/* ── Footer ── */}
      <footer className="py-6 text-center space-y-2">
        <nav className="flex justify-center gap-5 text-xs text-zinc-600">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
            (link) => (
              <button
                key={link}
                type="button"
                className="hover:text-zinc-400 transition-colors"
              >
                {link}
              </button>
            ),
          )}
        </nav>
        <p className="text-xs text-zinc-700">
          © 2024 RentalSaaS Inc. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
