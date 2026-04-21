import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { FieldError } from "@/components/ui/field";
import { loginCustomerWithGoogleHandoffFn } from "@/features/rental/auth/portal-auth.api";
import {
	getPortalAuthRedirectTarget,
	portalAuthRedirectSchema,
} from "@/features/rental/auth/portal-auth.redirect";
import { ProblemDetailsError } from "@/shared/errors";

const searchSchema = portalAuthRedirectSchema.extend({
	handoff_token: z.string().min(1),
});

export const Route = createFileRoute("/_portal/auth/google/finalize")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		await loginCustomerWithGoogleHandoffFn({
			data: {
				handoffToken: deps.handoff_token,
			},
		});

		throw redirect(getPortalAuthRedirectTarget(deps));
	},
	errorComponent: ({ error }) => <GoogleFinalizeErrorPage error={error} />,
	component: FinalizingGoogleLoginPage,
});

function FinalizingGoogleLoginPage() {
	return (
		<div className="flex min-h-svh items-center justify-center bg-neutral-100 px-4 py-10">
			<div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
				<div className="space-y-2">
					<h1 className="text-lg font-semibold">Iniciando sesion</h1>
					<p className="text-sm text-muted-foreground">
						Estamos preparando tu sesion en el portal.
					</p>
				</div>
				<div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
					<div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
					<span>Finalizando acceso...</span>
				</div>
			</div>
		</div>
	);
}

function GoogleFinalizeErrorPage({ error }: { error: unknown }) {
	const message = getRouteErrorMessage(error);

	return (
		<div className="flex min-h-svh items-center justify-center bg-neutral-100 px-4 py-10">
			<div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
				<div className="space-y-2">
					<h1 className="text-lg font-semibold">No pudimos iniciar sesion</h1>
					<p className="text-sm text-muted-foreground">
						Intenta nuevamente desde el portal.
					</p>
				</div>
				<div className="mt-4 space-y-4">
					<FieldError errors={[{ message }]} />
					<Link
						to="/login"
						className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 w-full items-center justify-center rounded-md px-2.5 text-sm font-medium transition-all"
					>
						Volver al login
					</Link>
				</div>
			</div>
		</div>
	);
}

function getRouteErrorMessage(error: unknown): string {
	if (error instanceof ProblemDetailsError) {
		if (error.problemDetails.status === 401) {
			return "El acceso con Google expiro o ya fue utilizado. Intenta nuevamente.";
		}

		return error.problemDetails.detail;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "Ocurrio un error inesperado al completar el acceso con Google.";
}
