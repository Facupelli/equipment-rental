import { useLogin } from "@/features/auth/auth-actions.queries";
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
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { loginSchema } from "@/features/auth/schemas/login-form.schema";
import { isAuthError, ProblemDetailsError } from "@/shared/errors";

export const Route = createFileRoute("/_admin/admin/login")({
	component: LoginPage,
});

const formId = "login-user";

function LoginPage() {
	const router = useRouter();
	const { mutateAsync: login, isPending } = useLogin();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);

			try {
				await login(value);
				router.navigate({ to: "/dashboard" });
			} catch (error) {
				if (isAuthError(error)) {
					setServerError("Invalid email or password");
					return;
				}

				if (error instanceof ProblemDetailsError || error instanceof Error) {
					setServerError(error.message);
				}
			}
		},
	});

	const [serverError, setServerError] = useState<string | null>(null);

	return (
		<div className="grid place-content-center bg-neutral-100 min-h-svh">
			<div className="grid gap-y-10">
				<h1 className="text-3xl font-bold text-primary text-center">DEPIQO</h1>

				<Card className="w-md">
					<CardHeader>
						<CardTitle>Admin Login</CardTitle>
						<CardDescription>
							Please authenticate to access your workspace.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							id={formId}
							onSubmit={(e) => {
								e.preventDefault();
								form.handleSubmit();
							}}
							className="space-y-10"
						>
							<FieldGroup>
								<form.Field name="email">
									{(field) => {
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
								</form.Field>
								<form.Field name="password">
									{(field) => {
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
								</form.Field>
							</FieldGroup>
						</form>
					</CardContent>
					<CardFooter className="grid gap-y-4">
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Field
									orientation="horizontal"
									data-invalid={!!serverError}
									className="grid gap-y-2"
								>
									<Button
										className="uppercase w-full py-5"
										type="submit"
										form={formId}
										disabled={!canSubmit || isPending}
									>
										{isSubmitting || isPending ? "Submitting..." : "Sign In"}
									</Button>

									{serverError && (
										<FieldError errors={[{ message: serverError }]} />
									)}
								</Field>
							)}
						</form.Subscribe>

						<div>
							<p className="text-center text-sm text-muted-foreground">
								Don't have an account?{" "}
								<Link to="/admin/register" className="underline">
									Register
								</Link>
							</p>
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
