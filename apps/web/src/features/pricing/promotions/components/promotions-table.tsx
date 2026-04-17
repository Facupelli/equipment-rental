import type { PromotionView } from "@repo/schemas";
import {
	PromotionActivationType,
	PromotionApplicabilityTarget,
	PromotionConditionType,
	PromotionEffectType,
	PromotionStackingType,
} from "@repo/types";
import { Badge } from "@/components/ui/badge";
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

export function PromotionsTable({ promotions }: PromotionsTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Promocion</TableHead>
					<TableHead>Condiciones</TableHead>
					<TableHead>Aplicabilidad</TableHead>
					<TableHead>Efecto</TableHead>
					<TableHead className="text-center">Prioridad</TableHead>
					<TableHead className="text-center">Stacking</TableHead>
					<TableHead className="text-right">Activa</TableHead>
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
										product types
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
					</TableRow>
				))}
			</TableBody>
		</Table>
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
		case PromotionConditionType.CATEGORY_ITEM_QUANTITY:
			return `Categoria ${condition.categoryId}: ${condition.minQuantity}+ item(s)`;
		case PromotionConditionType.DISTINCT_CATEGORIES_WITH_MIN_QUANTITY:
			return `${condition.minCategoriesMatched} categoria(s) de ${condition.categoryIds.length} con ${condition.minQuantityPerCategory}+ item(s)`;
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
				{promotion.effect.percentage}% off
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
