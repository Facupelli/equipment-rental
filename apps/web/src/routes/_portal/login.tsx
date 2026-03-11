import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Mail, Lock, UserCircle2 } from "lucide-react";
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
  customerLoginSchema,
  loginCustomerFormDefaults,
} from "@/features/rental/auth/login/customer-login-form.schema";
import { useCustomerLogin } from "@/features/rental/auth/portal-auth.queries";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_portal/login")({
  component: LoginPage,
});

function LoginPage() {
  const { tenantContext } = Route.useRouteContext();
  const navigate = useNavigate();
  const { mutateAsync: customerLogin } = useCustomerLogin();

  const form = useForm({
    defaultValues: loginCustomerFormDefaults,
    validators: {
      onSubmit: customerLoginSchema,
    },
    onSubmit: async ({ value }) => {
      if (tenantContext.face !== "portal") {
        return;
      }

      try {
        await customerLogin({
          ...value,
          tenantId: tenantContext.tenant.id,
        });
        navigate({ to: "/rental" });
      } catch (error) {
        console.log({ error });
      }
    },
  });

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
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
            <FieldGroup className="">
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
                      <div className="relative mt-1.5">
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
                      <div className="flex items-center justify-between">
                        <FieldLabel
                          htmlFor={field.name}
                          className="text-sm font-medium text-zinc-200"
                        >
                          Password
                        </FieldLabel>
                        <button
                          type="button"
                          className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative mt-1.5">
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

              {/* ── Remember device ── */}
              <form.Field
                name="rememberDevice"
                children={(field) => (
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(checked === true)
                      }
                      className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <label
                      htmlFor={field.name}
                      className="text-sm text-zinc-400 cursor-pointer select-none"
                    >
                      Remember this device
                    </label>
                  </div>
                )}
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
                  {isSubmitting ? "Signing in…" : "Sign In →"}
                </Button>
              )}
            />

            {/* ── Divider ── */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-neutral-800 text-xs uppercase tracking-widest text-zinc-600">
                  or continue with
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

        {/* ── Create account ── */}
        <p className="mt-6 text-sm text-neutral-500">
          New to the platform?{" "}
          <Link
            to="/register"
            className="font-semibold hover:text-neutral-300 transition-colors"
          >
            Create an account
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
