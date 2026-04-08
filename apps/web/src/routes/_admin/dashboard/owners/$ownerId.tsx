import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarRange } from "lucide-react";
import type { GetOwnerResponseDto } from "@repo/schemas";
import { Mail, Phone, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractHistoryTable } from "@/features/tenant/owners/components/contract-history-table";
import { ownerQueries } from "@/features/tenant/owners/owners.queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Suspense } from "react";
import { NewOwnerContractDialog } from "@/features/tenant/owners/components/owner-contract-dialog-form";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";

export const Route = createFileRoute("/_admin/dashboard/owners/$ownerId")({
	loader: ({ context: { queryClient }, params: { ownerId } }) =>
		queryClient.ensureQueryData(ownerQueries.detail(ownerId)),

	component: RouteComponent,
});

function RouteComponent() {
	const { ownerId } = Route.useParams();
	const { data: owner } = useSuspenseQuery(ownerQueries.detail(ownerId));

	const activeContract = owner!.contracts.find((c) => c.isActive) ?? null;

	const pastContracts = owner!.contracts
		.filter((c) => !c.isActive)
		.sort(
			(a, b) =>
				new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime(),
		);

	return (
		<ErrorBoundary FallbackComponent={OwnerDetailError}>
			<Suspense fallback={<OwnerDetailSkeleton />}>
				<div className="min-h-screen bg-neutral-50">
					<div className="mx-auto max-w-6xl px-8">
						<PageBreadcrumb
							parent={{ label: "Propietarios", to: "/dashboard/owners" }}
							current={owner.name}
						/>

						{/* Page header */}
						<div className="mb-8 flex items-start justify-between gap-4">
							<div>
								<h1 className="text-3xl font-bold tracking-tight text-neutral-900">
									Detalle del Propietario
								</h1>
								<p className="mt-1 text-sm text-neutral-500">
									Información contractual y datos de contacto
								</p>
							</div>
							<NewOwnerContractDialog ownerId={owner.id} />
						</div>

						{/* Top grid: owner card + active contract */}
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
							<OwnerCard owner={owner} />
							<ActiveContractCard contract={activeContract} />
						</div>

						{/* Contract history */}
						<div className="mt-6 rounded-lg border border-neutral-200 bg-white">
							<div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
								<h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
									Historial de Contratos
								</h2>
								<span className="font-mono text-xs text-neutral-400">
									{pastContracts.length}{" "}
									{pastContracts.length === 1 ? "registro" : "registros"}
								</span>
							</div>
							<div className="px-2">
								<ContractHistoryTable contracts={pastContracts} />
							</div>
						</div>
					</div>
				</div>
			</Suspense>
		</ErrorBoundary>
	);
}

interface OwnerCardProps {
	owner: GetOwnerResponseDto;
}

function OwnerCard({ owner }: OwnerCardProps) {
	const initials = owner.name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<Card className="border-neutral-200 bg-white shadow-none">
			<CardContent>
				<div className="flex items-start gap-4">
					{/* Avatar */}
					<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 font-mono text-lg font-semibold tracking-tight text-white">
						{initials}
					</div>

					{/* Name + status */}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h2 className="text-xl font-semibold text-neutral-900 leading-tight">
								{owner.name}
							</h2>
							{!owner.isActive && (
								<Badge variant="secondary" className="text-xs">
									Inactivo
								</Badge>
							)}
						</div>
						<p className="mt-0.5 font-mono text-xs text-neutral-400 tracking-wider uppercase">
							{owner.id.slice(0, 8).toUpperCase()}
						</p>
					</div>
				</div>

				{/* Contact fields */}
				<dl className="mt-6 space-y-3">
					<div className="flex items-center gap-3">
						<Mail className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
						<dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wider text-neutral-400">
							Email
						</dt>
						<dd className="text-sm text-neutral-700 truncate">
							{owner.email ?? "-"}
						</dd>
					</div>
					<div className="flex items-center gap-3">
						<Phone className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
						<dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wider text-neutral-400">
							Teléfono
						</dt>
						<dd className="text-sm text-neutral-700">{owner.phone ?? "-"}</dd>
					</div>
					<div className="flex items-start gap-3">
						<StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
						<dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wider text-neutral-400">
							Notas
						</dt>
						<dd className="text-sm text-neutral-600 leading-relaxed">
							{owner.notes ?? "-"}
						</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	);
}

type OwnerContract = GetOwnerResponseDto["contracts"][number];

interface ActiveContractCardProps {
	contract: OwnerContract | null;
}

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString("es-ES", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

function ActiveContractCard({ contract }: ActiveContractCardProps) {
	if (!contract) {
		return (
			<Card className="border-dashed border-neutral-200 bg-neutral-50 shadow-none">
				<CardContent className="flex h-full min-h-35 items-center justify-center">
					<p className="text-sm text-neutral-400">Sin contrato activo</p>
				</CardContent>
			</Card>
		);
	}

	const ownerPct = Math.round(contract.ownerShare * 100);
	const rentalPct = Math.round(contract.rentalShare * 100);

	return (
		<Card className="border-neutral-900 bg-neutral-900 text-white shadow-none">
			<CardHeader className="flex flex-row items-center justify-between">
				<span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
					Contrato Activo
				</span>
				<Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15">
					En vigor
				</Badge>
			</CardHeader>

			<CardContent>
				<div className="grid grid-cols-3 gap-6">
					{/* Split */}
					<div>
						<p className="text-xs uppercase tracking-wider text-neutral-500">
							Reparto
						</p>
						<p className="mt-1.5 font-mono text-4xl font-bold tracking-tight text-white">
							{ownerPct}
							<span className="text-neutral-500">/</span>
							{rentalPct}
						</p>
						<p className="mt-0.5 text-xs text-neutral-500">
							Propietario / Gestión
						</p>
					</div>

					{/* Basis */}
					<div>
						<p className="text-xs uppercase tracking-wider text-neutral-500">
							Base
						</p>
						<p className="mt-1.5 font-mono text-sm font-semibold text-neutral-200">
							{contract.basis}
						</p>
					</div>

					{/* Dates */}
					<div>
						<p className="text-xs uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
							<CalendarRange className="h-3 w-3" />
							Vigencia
						</p>
						<p className="mt-1.5 text-sm text-neutral-200">
							{formatDate(contract.validFrom)}
						</p>
						<p className="text-xs text-neutral-500">
							{contract.validUntil
								? `hasta ${formatDate(contract.validUntil)}`
								: "Indefinido"}
						</p>
					</div>
				</div>

				{contract.notes && (
					<p className="mt-4 border-t border-neutral-800 pt-4 text-xs text-neutral-500 leading-relaxed">
						{contract.notes}
					</p>
				)}
			</CardContent>
		</Card>
	);
}

function OwnerDetailSkeleton() {
	return (
		<div className="min-h-screen bg-neutral-50">
			<div className="mx-auto max-w-6xl px-6 py-10">
				{/* Breadcrumb */}
				<Skeleton className="mb-6 h-3 w-40" />

				{/* Header */}
				<div className="mb-8 flex items-start justify-between">
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-48" />
					</div>
					<Skeleton className="h-9 w-36" />
				</div>

				{/* Top grid */}
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
					<Skeleton className="h-52 rounded-lg" />
					<Skeleton className="h-52 rounded-lg" />
				</div>

				{/* History table */}
				<Skeleton className="mt-6 h-64 rounded-lg" />
			</div>
		</div>
	);
}

function OwnerDetailError({ error, resetErrorBoundary }: FallbackProps) {
	const message = error instanceof Error ? error.message : "Error desconocido.";

	return (
		<div className="min-h-screen bg-neutral-50">
			<div className="mx-auto max-w-6xl px-6 py-10">
				<div className="flex flex-col items-center justify-center rounded-lg border border-rose-100 bg-white py-20 text-center">
					<AlertTriangle className="mb-4 h-8 w-8 text-rose-400" />
					<h2 className="text-base font-semibold text-neutral-800">
						No se pudo cargar el propietario
					</h2>
					<p className="mt-1 text-sm text-neutral-500">{message}</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-6"
						onClick={resetErrorBoundary}
					>
						Reintentar
					</Button>
				</div>
			</div>
		</div>
	);
}
