import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  getPortalAuthRedirectTarget,
  portalAuthRedirectSchema,
} from "@/features/rental/auth/portal-auth.redirect";
import { useCustomerLogin } from "@/features/rental/auth/portal-auth.queries";
import { Link } from "@tanstack/react-router";
import { buildR2PublicUrl } from "@/lib/r2-public-url";
import { PoweredByFooter } from "@/shared/components/powered-by-footer";

export const Route = createFileRoute("/_portal/login")({
  validateSearch: portalAuthRedirectSchema,
  beforeLoad: ({ context }) => {
    if (context.tenantContext.face !== "portal") {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: LoginPage,
});

const formId = "login-customer";

function LoginPage() {
  const { tenantContext } = Route.useRouteContext();
  const redirectSearch = Route.useSearch();

  const navigate = useNavigate();
  const { mutateAsync: customerLogin, isPending } = useCustomerLogin();

  const form = useForm({
    defaultValues: loginCustomerFormDefaults,
    validators: {
      onSubmit: customerLoginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await customerLogin(value);
        navigate(getPortalAuthRedirectTarget(redirectSearch));
      } catch (error) {
        console.log({ error });
      }
    },
  });

  if (tenantContext.face !== "portal") {
    return <div>Tenant not found</div>;
  }

  const src = buildR2PublicUrl(tenantContext.tenant.logoUrl, "branding");

  return (
    <div className="grid grid-rows-[1fr_auto] min-h-svh bg-neutral-100">
      <main className="flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* ── Logo + heading ── */}
          <div className="space-y-2">
            {src && (
              <div className="flex justify-center">
                <img
                  src={src}
                  alt={tenantContext.tenant.name}
                  className="size-32 object-contain"
                />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-sm text-muted-foreground">
                Accede a tu cuenta para gestionar tus reservas.
              </p>
            </div>
          </div>

          {/* ── Form ── */}
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            noValidate
          >
            <FieldGroup>
              {/* ── Email ── */}
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Correo Electrónico
                      </FieldLabel>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          placeholder="usuario@empresa.com"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="pl-9"
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
                      <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
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
                          className="pl-9"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          className="text-xs font-semibold cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ¿OLVIDÓ SU CONTRASEÑA?
                        </button>
                      </div>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              {/* ── Submit ── */}
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    className="w-full py-5"
                    type="submit"
                    form={formId}
                    disabled={!canSubmit || isPending}
                  >
                    {isSubmitting ? "Iniciando..." : "Iniciar Sesión"}
                  </Button>
                )}
              />
            </FieldGroup>
          </form>

          {/* ── Bottom links ── */}
          <div className="space-y-4">
            <div className="h-px bg-accent w-full" />
            <p className="text-center text-sm text-muted-foreground">
              ¿No tiene una cuenta?{" "}
              <Link
                to="/register"
                search={redirectSearch}
                className="underline font-semibold"
              >
                Crear una cuenta
              </Link>
            </p>
          </div>
        </div>
      </main>

      <PoweredByFooter />
    </div>
  );
}
