import { createFileRoute, redirect } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { Mail, Lock, Building2, Clock, Watch, File } from "lucide-react";
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
	toRegisterCustomerDto,
} from "@/features/rental/auth/register/customer-register-form.schema";
import {
	getPortalAuthRedirectTarget,
	portalAuthRedirectSchema,
} from "@/features/rental/auth/portal-auth.redirect";
import {
	useCustomerLogin,
	useCustomerRegister,
} from "@/features/rental/auth/portal-auth.queries";
import { Link } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { buildR2PublicUrl } from "@/lib/r2-public-url";

export const Route = createFileRoute("/_portal/register")({
	validateSearch: portalAuthRedirectSchema,
	beforeLoad: ({ context }) => {
		if (context.tenantContext.face !== "portal") {
			throw redirect({ to: "/admin/login" });
		}
	},
	component: RegisterPage,
});

const formId = "register-customer";

function RegisterPage() {
	const { tenantContext } = Route.useRouteContext();
	const redirectSearch = Route.useSearch();
	const navigate = Route.useNavigate();

	const { mutateAsync: register, isPending } = useCustomerRegister();
	const { mutateAsync: customerLogin } = useCustomerLogin();

	const form = useForm({
		defaultValues: customerRegisterDefaultValues,
		validators: {
			onSubmit: customerRegisterSchema,
		},
		onSubmit: async ({ value }) => {
			const dto = toRegisterCustomerDto(value);

			try {
				await register(dto);
				await customerLogin({
					email: value.email,
					password: value.password,
				});
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
		<div className="min-h-screen bg-neutral-100 flex flex-col">
			<main className="flex-1 flex items-center justify-center px-4 gap-20 ">
				<div className="w-md space-y-6">
					<h1 className="font-black text-6xl">{tenantContext.tenant.name}</h1>
					{src && (
						<div>
							<img
								src={src}
								alt={tenantContext.tenant.name}
								className="size-72 object-contain"
							/>
						</div>
					)}
					<p className="text-muted-foreground text-lg">
						Acceda al mejor equipamiento profesional. Gestione sus reservas de
						forma sencilla y potencia sus proyectos con nuestra infraestructura
						de alquiler de alto nivel.
					</p>
					<ul className="border-l border-neutral-300 text-muted-foreground space-y-2 pl-4">
						<li className="flex items-center gap-2">
							<Clock /> Reserva de equipos en tiempor real
						</li>
						<li className="flex items-center gap-2">
							<File /> Gestión simplificada de contratos
						</li>
						<li className="flex items-center gap-2">
							<Watch /> Seguimiento detallado de sus alquileres
						</li>
					</ul>
				</div>

				<Card className="w-lg">
					<CardHeader>
						<CardTitle>Crear nueva cuenta</CardTitle>
						<CardDescription>
							Complete los campos para iniciar su registro.
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
													<FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														type="text"
														placeholder="Juan"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
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
													<FieldLabel htmlFor={field.name}>Apellido</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														type="text"
														placeholder="Pérez"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
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
														form.setFieldValue("companyName", undefined);
													}
												}}
											/>
											<label
												htmlFor={field.name}
												className="text-sm text-zinc-400 cursor-pointer select-none"
											>
												Soy una empresa
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
															<FieldLabel htmlFor={field.name}>
																Nombre de la empresa
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
										) : null
									}
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
										{isSubmitting ? "Creando..." : "Crear Cuenta"}
									</Button>
								</Field>
							)}
						/>

						<div>
							<p className="text-center text-xs text-muted-foreground">
								Al registrarse aceptas nuestros{" "}
								<Link
									to="/admin/login"
									className="underline font-semibold"
									preload={false}
								>
									Términos de Servicio
								</Link>{" "}
								y{" "}
								<Link
									to="/admin/login"
									className="underline font-semibold"
									preload={false}
								>
									Política de Privacidad
								</Link>
							</p>
						</div>

						<div className="h-px bg-accent w-full"></div>

						<div>
							<p className="text-center text-sm text-muted-foreground">
								Ya tienes una cuenta?{" "}
								<Link to="/login" search={redirectSearch} className="underline">
									Iniciar sesión
								</Link>
							</p>
						</div>
					</CardFooter>
				</Card>
			</main>
		</div>
	);
}
