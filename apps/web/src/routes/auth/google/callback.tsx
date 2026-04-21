import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { FieldError } from "@/components/ui/field";
import { authenticateCustomerWithGoogleFn } from "@/features/rental/auth/google/google-auth.api";
import {
	decodeGoogleAuthState,
	getGoogleCallbackRedirectUri,
} from "@/features/rental/auth/google/google-auth.redirect";
import { ProblemDetailsError } from "@/shared/errors";

const searchSchema = z.object({
	code: z.string().min(1).optional(),
	error: z.string().min(1).optional(),
	error_description: z.string().min(1).optional(),
	state: z.string().min(1).optional(),
});

export const Route = createFileRoute("/auth/google/callback")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		if (deps.error) {
			throw new Error(
				deps.error_description ?? "Google rechazo la autenticacion.",
			);
		}

		if (!deps.code) {
			throw new Error("Google no devolvio un codigo de autorizacion.");
		}

		if (!deps.state) {
			throw new Error("Google no devolvio un estado de autenticacion valido.");
		}

		const response = await authenticateCustomerWithGoogleFn({
			data: {
				code: deps.code,
				redirectUri: getGoogleCallbackRedirectUri(),
				state: deps.state,
			},
		});

		const { redirectPath } = decodeGoogleAuthState(deps.state);
		const finalizeUrl = new URL("/auth/google/finalize", response.portal_origin);
		finalizeUrl.searchParams.set("handoff_token", response.handoff_token);
		finalizeUrl.searchParams.set("redirectTo", redirectPath);

		throw redirect({ href: finalizeUrl.toString() });
	},
	errorComponent: ({ error }) => <GoogleAuthErrorPage error={error} />,
	component: RedirectingToPortalPage,
});

function RedirectingToPortalPage() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-neutral-100 px-4 py-10">
			<div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
				<div className="space-y-2">
					<h1 className="text-lg font-semibold">Completando acceso</h1>
					<p className="text-sm text-muted-foreground">
						Estamos validando tu cuenta y regresando al portal.
					</p>
				</div>
				<div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
					<div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
					<span>Redirigiendo...</span>
				</div>
			</div>
		</div>
	);
}

function GoogleAuthErrorPage({ error }: { error: unknown }) {
	const message = getRouteErrorMessage(error);

	return (
		<div className="flex min-h-svh items-center justify-center bg-neutral-100 px-4 py-10">
			<div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
				<div className="space-y-2">
					<h1 className="text-lg font-semibold">No pudimos completar el acceso</h1>
					<p className="text-sm text-muted-foreground">
						Revisa el error e intenta nuevamente.
					</p>
				</div>
				<div className="mt-4 space-y-4">
					<FieldError errors={[{ message }]} />
					<Link
						to="/"
						className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 w-full items-center justify-center rounded-md px-2.5 text-sm font-medium transition-all"
					>
						Volver
					</Link>
				</div>
			</div>
		</div>
	);
}

function getRouteErrorMessage(error: unknown): string {
	if (error instanceof ProblemDetailsError) {
		if (error.problemDetails.status === 401) {
			return "No pudimos iniciar sesion con Google.";
		}

		return error.problemDetails.detail;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Ocurrio un error inesperado al autenticar con Google.";
}
