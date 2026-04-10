import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
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
import { Button } from "@/components/ui/button";
import { useCreateTenantUser } from "@/features/auth/auth-actions.queries";
import {
	registerFormDefaults,
	registerFormSchema,
	toRegisterDto,
} from "@/features/auth/schemas/register-form.schema";
import { ProblemDetailsError } from "@/shared/errors";

export const Route = createFileRoute("/_admin/admin/register")({
	component: RegisterPage,
});

const formId = "register-user-tenant";

function RegisterPage() {
	const { mutateAsync: createTenantUser, isPending } = useCreateTenantUser();

	const form = useForm({
		defaultValues: registerFormDefaults,
		validators: {
			onSubmit: registerFormSchema,
		},
		onSubmit: async ({ value }) => {
			const dto = toRegisterDto(value);
			try {
				const data = await createTenantUser(dto);
				setSuccessData(data);
			} catch (error) {
				console.log(error);
				if (error instanceof ProblemDetailsError || error instanceof Error) {
					setServerError(error.message);
				}
			}
		},
	});

	const [successData, setSuccessData] = useState<{
		userId: string;
		tenantId: string;
	} | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);

	if (successData) {
		return (
			<div>
				<h2>Registration successful!</h2>
				<p>Your account has been created. You can now log in.</p>
			</div>
		);
	}

	return (
		<div className="grid place-content-center bg-neutral-100 min-h-svh">
			{serverError && <p role="alert">{serverError}</p>}

			<div className="grid gap-y-10">
				<h1 className="text-3xl font-bold text-primary text-center">DEPIQO</h1>

				<Card className="w-md">
					<CardHeader>
						<CardTitle>Create Admin Account</CardTitle>
						<CardDescription>
							Initialize your organizational workspace.
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
							className="space-y-10"
						>
							<FieldGroup>
								<form.Field
									name="tenantName"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Company Name:
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													placeholder="e.g. Skyline Logisitics"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
							</FieldGroup>

							<FieldGroup>
								<div className="flex items-center gap-x-4">
									<form.Field
										name="firstName"
										children={(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>
														First Name:
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="Alexander"
														autoComplete="off"
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
													<FieldLabel htmlFor={field.name}>
														Last Name:
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														placeholder="Ross"
														autoComplete="off"
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									/>
								</div>
								<form.Field
									name="email"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Email:</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													type="email"
													placeholder="admin@skylines.com"
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								/>
								<form.Field
									name="password"
									children={(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>Password:</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
													type="password"
													placeholder="********"
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
					</CardContent>
					<CardFooter className="grid gap-y-4">
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
							children={([canSubmit, isSubmitting]) => (
								<Field orientation="horizontal">
									<Button
										className="uppercase w-full py-5"
										type="submit"
										form={formId}
										disabled={!canSubmit || isPending}
									>
										{isSubmitting ? "..." : "Create Account"}
									</Button>
								</Field>
							)}
						/>

						<div>
							<p className="text-center text-sm text-muted-foreground">
								Already have an account?{" "}
								<Link to="/admin/login" className="underline">
									Log in
								</Link>
							</p>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
