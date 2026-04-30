import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { ParsedPublicSigningSessionResponseDto } from "../document-signing.queries";

type PublicSigningSessionPanelProps = {
	session: ParsedPublicSigningSessionResponseDto;
};

export function PublicSigningSessionPanel({
	session,
}: PublicSigningSessionPanelProps) {
	const statusMeta = getStatusMeta(session.status);

	return (
		<Card className="border-neutral-200 bg-white">
			<CardHeader className="gap-2 sm:flex sm:flex-row sm:items-start sm:justify-between">
				<div>
					<CardTitle className="text-xl font-semibold text-neutral-950">
						Firma de contrato
					</CardTitle>
					<CardDescription className="text-sm leading-6 text-neutral-600">
						Revisa el documento original enviado por email y completa tus datos
						antes de aceptarlo.
					</CardDescription>
				</div>
				<Badge variant="outline" className={statusMeta.className}>
					{statusMeta.label}
				</Badge>
			</CardHeader>
		</Card>
	);
}

function getStatusMeta(
	status: ParsedPublicSigningSessionResponseDto["status"],
) {
	switch (status) {
		case "OPENED":
			return {
				label: "En revision",
				className: "border-sky-200 bg-sky-50 text-sky-700",
			};
		case "SIGNED":
			return {
				label: "Firmado",
				className: "border-emerald-200 bg-emerald-50 text-emerald-700",
			};
		case "VOIDED":
			return {
				label: "No disponible",
				className: "border-red-200 bg-red-50 text-red-700",
			};
		case "PENDING":
		default:
			return {
				label: "Pendiente",
				className: "border-amber-200 bg-amber-50 text-amber-700",
			};
	}
}
