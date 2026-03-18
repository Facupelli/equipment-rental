import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { useCustomerLogin } from "@/features/rental/auth/portal-auth.queries";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_portal/login")({
  component: LoginPage,
});

const formId = "login-customer";

function LoginPage() {
  const { tenantContext } = Route.useRouteContext();
  const navigate = useNavigate();
  const { mutateAsync: customerLogin, isPending } = useCustomerLogin();

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
    <div className="bg-neutral-100 flex flex-col">
      <main className="h-svh grid grid-cols-[1fr_620px]">
        <div className="bg-neutral-900 h-full flex items-center justify-center ">
          <div className="w-md">
            <h1 className="font-black text-6xl text-white">RENTAL BLUEPRINT</h1>
          </div>
        </div>

        <div className="h-full justify-center flex items-center">
          <Card className="w-xl">
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>
                Acceda para poder alquilar equipos en esta tienda.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                id={formId}
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
                          <FieldLabel htmlFor={field.name}>
                            Correo Electrónico
                          </FieldLabel>
                          <div className="relative mt-1.5">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                            <Input
                              id={field.name}
                              name={field.name}
                              type="email"
                              placeholder="usuario@empresa.com"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
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
                          <div className="flex items-center justify-between">
                            <FieldLabel htmlFor={field.name}>
                              Contraseña
                            </FieldLabel>
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
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
                              aria-invalid={isInvalid}
                              className="pl-9"
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="text-xs font-semibold cursor-pointer text-muted-foreground"
                            >
                              OLVIDÓ SU CONTRASEÑA?
                            </button>
                          </div>
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

            <CardFooter className="grid gap-y-4">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Field orientation="horizontal">
                    <Button
                      className="w-full py-5"
                      type="submit"
                      form={formId}
                      disabled={!canSubmit || isPending}
                    >
                      {isSubmitting ? "Iniciando..." : "Iniciar Sesión"}
                    </Button>
                  </Field>
                )}
              />

              <div className="h-px bg-accent w-full"></div>

              <div>
                <p className="text-center text-sm text-muted-foreground">
                  No tiene una cuenta?{" "}
                  <Link to="/register" className="underline">
                    Crear una cuenta
                  </Link>
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
