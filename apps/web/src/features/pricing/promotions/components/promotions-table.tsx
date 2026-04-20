import type { PromotionView } from "@repo/schemas";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
	PromotionActivationType,
	PromotionApplicabilityTarget,
	PromotionConditionType,
	PromotionEffectType,
	PromotionStackingType,
} from "@repo/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface PromotionsTableProps {
	promotions: PromotionView[];
	onEdit: (promotion: PromotionView) => void;
	onDelete: (promotion: PromotionView) => void;
}

const ACTIVATION_TYPE_LABELS: Record<PromotionActivationType, string> = {
	[PromotionActivationType.AUTOMATIC]: "Automatica",
	[PromotionActivationType.COUPON]: "Con cupon",
};

const STACKING_TYPE_LABELS: Record<PromotionStackingType, string> = {
	[PromotionStackingType.EXCLUSIVE]: "Exclusiva",
	[PromotionStackingType.COMBINABLE]: "Combinable",
};

const APPLICABILITY_LABELS: Record<PromotionApplicabilityTarget, string> = {
	[PromotionApplicabilityTarget.PRODUCT]: "Productos",
	[PromotionApplicabilityTarget.BUNDLE]: "Bundles",
};

export function PromotionsTable({
	promotions,
	onDelete,
	onEdit,
}: PromotionsTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Promocion</TableHead>
					<TableHead>Condiciones</TableHead>
					<TableHead>Aplicabilidad</TableHead>
					<TableHead>Efecto</TableHead>
					<TableHead className="text-center">Prioridad</TableHead>
					<TableHead className="text-center">Acumulacion</TableHead>
					<TableHead className="text-right">Activa</TableHead>
					<TableHead className="w-16 text-right">Acciones</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{promotions.map((promotion) => (
					<TableRow key={promotion.id}>
						<TableCell className="align-top">
							<div className="space-y-2">
								<div>
									<p className="font-medium text-sm text-foreground">
										{promotion.name}
									</p>
									<p className="text-muted-foreground text-xs">
										{formatValidity(promotion)}
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									<Badge variant="outline">
										{ACTIVATION_TYPE_LABELS[promotion.activationType]}
									</Badge>
									<Badge variant="secondary">
										{STACKING_TYPE_LABELS[promotion.stackingType]}
									</Badge>
								</div>
							</div>
						</TableCell>
						<TableCell className="align-top text-sm text-muted-foreground">
							{promotion.conditions.length === 0 ? (
								<span>Sin condiciones</span>
							) : (
								<div className="space-y-1">
									{promotion.conditions.map((condition, index) => (
										<p key={`${condition.type}-${index}`}>
											{formatCondition(condition)}
										</p>
									))}
								</div>
							)}
						</TableCell>
						<TableCell className="align-top text-sm text-muted-foreground">
							<div className="space-y-1">
								<p>{formatApplicability(promotion)}</p>
								{promotion.applicability.excludedProductTypeIds.length > 0 && (
									<p>
										Excluye{" "}
										{promotion.applicability.excludedProductTypeIds.length}{" "}
										tipos de producto
									</p>
								)}
								{promotion.applicability.excludedBundleIds.length > 0 && (
									<p>
										Excluye {promotion.applicability.excludedBundleIds.length}{" "}
										bundles
									</p>
								)}
							</div>
						</TableCell>
						<TableCell className="align-top">
							{formatEffect(promotion)}
						</TableCell>
						<TableCell className="text-center text-sm tabular-nums align-top">
							{promotion.priority}
						</TableCell>
						<TableCell className="text-center align-top">
							<Badge
								variant={
									promotion.stackingType === PromotionStackingType.COMBINABLE
										? "secondary"
										: "outline"
								}
							>
								{promotion.stackingType === PromotionStackingType.COMBINABLE
									? "Si"
									: "No"}
							</Badge>
						</TableCell>
						<TableCell className="text-right align-top">
							<Switch
								checked={promotion.isActive}
								disabled
								aria-label="Estado de la promocion"
							/>
						</TableCell>
						<TableCell className="text-right align-top">
							<RowActions
								onEdit={() => onEdit(promotion)}
								onDelete={() => onDelete(promotion)}
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function RowActions({
	onDelete,
	onEdit,
}: {
	onDelete: () => void;
	onEdit: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label="Abrir acciones de la promocion"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuItem onClick={onEdit}>
					<Pencil className="h-4 w-4" />
					Editar
				</DropdownMenuItem>
				<DropdownMenuItem variant="destructive" onClick={onDelete}>
					<Trash2 className="h-4 w-4" />
					Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function formatValidity(promotion: PromotionView) {
	if (!promotion.validFrom && !promotion.validUntil) {
		return "Sin ventana global";
	}

	const from = promotion.validFrom
		? promotion.validFrom.toLocaleDateString("es-ES")
		: "Siempre";
	const until = promotion.validUntil
		? promotion.validUntil.toLocaleDateString("es-ES")
		: "Sin fin";

	return `${from} - ${until}`;
}

function formatCondition(condition: PromotionView["conditions"][number]) {
	switch (condition.type) {
		case PromotionConditionType.BOOKING_WINDOW:
			return `Reserva entre ${formatDate(condition.from)} y ${formatDate(condition.to)}`;
		case PromotionConditionType.RENTAL_WINDOW:
			return `Alquiler entre ${formatDate(condition.from)} y ${formatDate(condition.to)}`;
		case PromotionConditionType.CUSTOMER_ID_IN:
			return `${condition.customerIds.length} cliente(s) permitidos`;
		case PromotionConditionType.MIN_SUBTOTAL:
			return `Subtotal minimo ${condition.amount} ${condition.currency}`;
		case PromotionConditionType.RENTAL_DURATION_MIN:
			return `Duracion minima de ${condition.minUnits} unidad(es)`;
		case PromotionConditionType.MIN_PRODUCT_QUANTITY:
			return `${condition.minQuantity}+ producto(s) individuales`;
		case PromotionConditionType.MIN_PRODUCT_UNIT_PRICE:
			return `Producto con precio base minimo de ${condition.amount} ${condition.currency}`;
		default:
			return "Condicion desconocida";
	}
}

function formatApplicability(promotion: PromotionView) {
	return promotion.applicability.appliesTo
		.map((target) => APPLICABILITY_LABELS[target])
		.join(" + ");
}

function formatEffect(promotion: PromotionView) {
	if (promotion.effect.type === PromotionEffectType.PERCENT_OFF) {
		return (
			<span className="font-semibold text-sm">
				{promotion.effect.percentage}% de descuento
			</span>
		);
	}

	return (
		<div className="space-y-1">
			{promotion.effect.tiers.map((tier, index) => {
				const range =
					tier.toUnits === null
						? `${tier.fromUnits}+ unidades`
						: `${tier.fromUnits}–${tier.toUnits} unidades`;
				return (
					<p key={index} className="text-sm font-semibold">
						{range}: {tier.percentage}%
					</p>
				);
			})}
		</div>
	);
}

function formatDate(value: string | Date) {
	return new Date(value).toLocaleDateString("es-ES");
}
