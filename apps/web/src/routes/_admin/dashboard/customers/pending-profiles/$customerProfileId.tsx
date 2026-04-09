import type { CustomerProfileResponseDto } from "@repo/schemas";
import { createFileRoute } from "@tanstack/react-router";
import {
	BriefcaseBusiness,
	CircleCheck,
	FileText,
	Landmark,
	MapPin,
	User,
	Users,
	X,
} from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { PageBreadcrumb } from "@/components/detail-id-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	formatReviewDate,
	formatReviewDateTime,
	getDocumentFileName,
	getReviewStatusClasses,
	getReviewStatusLabel,
	getSafeValue,
	maskAccountNumber,
} from "@/features/customer/components/review/customer-profile-review.utils";
import {
	customerQueries,
	useCustomerProfileReview,
} from "@/features/customer/customer.queries";
import { useCustomerProfileReviewActions } from "@/features/customer/hooks/use-customer-profile-review-actions";
import { cn } from "@/lib/utils";
import { AdminRouteError } from "@/shared/components/admin-route-error";

export const Route = createFileRoute(
	"/_admin/dashboard/customers/pending-profiles/$customerProfileId",
)({
	loader: ({ context: { queryClient }, params: { customerProfileId } }) =>
		queryClient.ensureQueryData(
			customerQueries.profileReview(customerProfileId),
		),
	pendingComponent: CustomerProfileReviewPageSkeleton,
	errorComponent: ({ error }) => (
		<AdminRouteError
			error={error}
			genericMessage="No pudimos cargar el expediente del cliente."
			forbiddenMessage="No tienes permisos para revisar este expediente."
		/>
	),
	component: PendingProfileReviewPage,
});

function PendingProfileReviewPage() {
	const { customerProfileId } = Route.useParams();

	const { data: profile, isLoading } =
		useCustomerProfileReview(customerProfileId);

	if (isLoading) {
		return <CustomerProfileReviewPageSkeleton />;
	}

	if (!profile) {
		return (
			<div className="space-y-6 px-6 pb-6">
				<PageBreadcrumb
					parent={{
						label: "Altas de cliente",
						to: "/dashboard/customers/pending-profiles",
					}}
					current="Revision"
				/>
				<p className="text-sm text-muted-foreground">
					No encontramos el perfil para revisar.
				</p>
			</div>
		);
	}

	return <CustomerProfileReviewView profile={profile} />;
}

function CustomerProfileReviewView({
	profile,
}: {
	profile: CustomerProfileResponseDto;
}) {
	const {
		auditorNotes,
		handleApprove,
		handleAuditorNotesChange,
		handleReject,
		isSubmitting,
		reviewError,
	} = useCustomerProfileReviewActions({
		customerProfileId: profile.id,
	});

	return (
		<div className="space-y-6 px-6 pb-6">
			<CustomerProfileReviewHeader profile={profile} />

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
				<div className="space-y-6">
					<ReviewSectionCard icon={User} title="Datos personales">
						<div className="grid gap-6 md:grid-cols-2">
							<ReviewField label="Nombre completo" value={profile.fullName} />
							<ReviewField label="Numero de telefono" value={profile.phone} />
							<ReviewField
								label="Fecha de nacimiento"
								value={formatReviewDate(profile.birthDate)}
							/>
							<ReviewField
								label="Numero de DNI"
								value={profile.documentNumber}
							/>
						</div>
					</ReviewSectionCard>

					<ReviewSectionCard
						icon={FileText}
						title="Documentacion"
						actions={
							<a
								aria-label="Abrir documento enviado"
								href={profile.identityDocumentPath}
								target="_blank"
								rel="noreferrer"
								className={buttonVariants({ variant: "outline", size: "sm" })}
							>
								Abrir documento
							</a>
						}
					>
						<div className="rounded-lg border border-dashed bg-muted/30 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Archivo enviado
							</p>
							<p className="mt-2 text-sm font-medium text-foreground">
								{getDocumentFileName(profile.identityDocumentPath)}
							</p>
							<p className="mt-2 text-sm text-muted-foreground">
								El documento se abre en una pestana nueva para la validacion
								manual.
							</p>
						</div>
					</ReviewSectionCard>

					<ReviewSectionCard icon={MapPin} title="Direccion">
						<div className="grid gap-6 md:grid-cols-2">
							<div className="md:col-span-2">
								<ReviewField label="Calle y numero" value={profile.address} />
							</div>
							<ReviewField label="Ciudad" value={profile.city} />
							<ReviewField
								label="Provincia o region"
								value={profile.stateRegion}
							/>
							<ReviewField label="Pais" value={profile.country} />
						</div>
					</ReviewSectionCard>

					<ReviewSectionCard
						icon={BriefcaseBusiness}
						title="Informacion profesional y bancaria"
					>
						<div className="grid gap-6 lg:grid-cols-2">
							<div className="space-y-6">
								<ReviewField label="Ocupacion" value={profile.occupation} />
								<ReviewField
									label="Empresa"
									value={getSafeValue(profile.company)}
								/>
								<ReviewField
									label="CUIT o identificacion fiscal"
									value={getSafeValue(profile.taxId)}
								/>
								<ReviewField
									label="Razon social"
									value={getSafeValue(profile.businessName)}
								/>
							</div>

							<div className="space-y-6 rounded-lg border bg-muted/20 p-4">
								<div className="flex items-center gap-2 text-sm font-medium text-foreground">
									<Landmark className="h-4 w-4 text-muted-foreground" />
									Datos bancarios
								</div>
								<ReviewField label="Banco" value={profile.bankName} />
								<ReviewField
									label="Numero de cuenta"
									value={maskAccountNumber(profile.accountNumber)}
								/>
							</div>
						</div>
					</ReviewSectionCard>

					<ReviewSectionCard icon={Users} title="Contactos de referencia">
						<div className="grid gap-4 md:grid-cols-2">
							<ReferenceContactCard
								name={profile.contact1Name}
								relationship={profile.contact1Relationship}
							/>
							<ReferenceContactCard
								name={profile.contact2Name}
								relationship={profile.contact2Relationship}
							/>
						</div>
					</ReviewSectionCard>
				</div>

				<CustomerProfileReviewActionsPanel
					profile={profile}
					auditorNotes={auditorNotes}
					errorMessage={reviewError}
					isSubmitting={isSubmitting}
					onApprove={handleApprove}
					onAuditorNotesChange={handleAuditorNotesChange}
					onReject={handleReject}
				/>
			</div>
		</div>
	);
}

function CustomerProfileReviewHeader({
	profile,
}: {
	profile: CustomerProfileResponseDto;
}) {
	return (
		<div className="border-b border-border pb-4">
			<PageBreadcrumb
				parent={{
					label: "Altas de cliente",
					to: "/dashboard/customers/pending-profiles",
				}}
				current={profile.fullName}
			/>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-2">
					<h1 className="text-3xl font-semibold tracking-tight text-foreground">
						{profile.fullName}
					</h1>
					<p className="text-sm text-muted-foreground">
						Perfil enviado el {formatReviewDateTime(profile.submittedAt)}
					</p>
				</div>

				<div className="space-y-2 lg:text-right">
					<Badge
						variant="outline"
						className={cn(
							"h-7 rounded-full px-3 text-sm font-medium",
							getReviewStatusClasses(profile.status),
						)}
					>
						{getReviewStatusLabel(profile.status)}
					</Badge>
				</div>
			</div>
		</div>
	);
}

function ReviewSectionCard({
	icon: Icon,
	title,
	actions,
	children,
}: {
	icon: ElementType;
	title: string;
	actions?: ReactNode;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between gap-4 border-b pb-4">
				<div className="flex items-center gap-3">
					<div className="rounded-md bg-muted p-2 text-muted-foreground">
						<Icon className="h-4 w-4" />
					</div>
					<CardTitle className="text-base font-semibold">{title}</CardTitle>
				</div>
				{actions}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

function ReviewField({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-1.5">
			<p className="text-xs font-medium uppercase text-muted-foreground">
				{label}
			</p>
			<p className="text-sm font-medium text-foreground">{value}</p>
		</div>
	);
}

function ReferenceContactCard({
	name,
	relationship,
}: {
	name: string;
	relationship: string;
}) {
	return (
		<div className="rounded-lg border bg-muted/20 p-2">
			<p className="text-sm font-semibold text-foreground">{name}</p>
			<p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
				{relationship}
			</p>
		</div>
	);
}

function CustomerProfileReviewActionsPanel({
	profile,
	auditorNotes,
	errorMessage,
	isSubmitting,
	onApprove,
	onAuditorNotesChange,
	onReject,
}: {
	profile: CustomerProfileResponseDto;
	auditorNotes: string;
	errorMessage: string | null;
	isSubmitting: boolean;
	onApprove: () => void;
	onAuditorNotesChange: (value: string) => void;
	onReject: () => void;
}) {
	return (
		<div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						Acciones de revision
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-3">
						<Button
							type="button"
							className="w-full"
							size="lg"
							onClick={onApprove}
							disabled={isSubmitting}
						>
							<CircleCheck className="h-4 w-4" />
							{isSubmitting ? "Procesando..." : "Aprobar alta"}
						</Button>
						<Button
							type="button"
							variant="outline"
							className="w-full"
							size="lg"
							onClick={onReject}
							disabled={isSubmitting}
						>
							<X className="h-4 w-4" />
							{isSubmitting ? "Procesando..." : "Rechazar"}
						</Button>
					</div>

					<div className="space-y-2">
						<p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
							Notas del auditor
						</p>
						<Textarea
							value={auditorNotes}
							onChange={(event) => onAuditorNotesChange(event.target.value)}
							placeholder="Escriba aqui sus observaciones internas sobre la verificacion del expediente..."
							className="min-h-40 resize-none"
						/>
						<p className="text-xs text-muted-foreground">
							Estas notas son solo visibles para el equipo de auditoria.
						</p>
						{errorMessage ? (
							<p className="text-sm font-medium text-destructive">
								{errorMessage}
							</p>
						) : null}
					</div>

					<div className="space-y-4 rounded-lg border bg-muted/20 p-4">
						<ReviewField
							label="Estado"
							value={getReviewStatusLabel(profile.status)}
						/>
						<ReviewField
							label="Fecha de envio"
							value={formatReviewDateTime(profile.submittedAt)}
						/>
						<ReviewField
							label="Revisado el"
							value={formatReviewDateTime(profile.reviewedAt)}
						/>
						<ReviewField
							label="Revisado por"
							value={getSafeValue(profile.reviewedById)}
						/>
						<ReviewField
							label="Motivo de rechazo"
							value={getSafeValue(profile.rejectionReason)}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export function CustomerProfileReviewPageSkeleton() {
	return (
		<div className="space-y-6 px-6 pb-6">
			<div className="space-y-4 border-b border-border pb-6">
				<Skeleton className="h-5 w-60" />
				<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="space-y-2">
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-10 w-72" />
						<Skeleton className="h-4 w-52" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-7 w-48 rounded-full" />
					</div>
				</div>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
				<div className="space-y-6">
					{["personal", "document", "address", "work", "references"].map(
						(sectionId) => (
							<Skeleton key={sectionId} className="h-56 w-full rounded-xl" />
						),
					)}
				</div>
				<Skeleton className="h-130 w-full rounded-xl" />
			</div>
		</div>
	);
}
