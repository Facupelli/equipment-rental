import type { PromotionView } from "@repo/schemas";
import { PricingRuleEffectType, PromotionType } from "@repo/types";
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

const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
	[PromotionType.COUPON]: "Cupón",
	[PromotionType.SEASONAL]: "Estacional",
	[PromotionType.CUSTOMER_SPECIFIC]: "Cliente específico",
};

export function PromotionsTable({ promotions }: PromotionsTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Nombre</TableHead>
					<TableHead>Tipo</TableHead>
					<TableHead>Condición</TableHead>
					<TableHead>Descuento</TableHead>
					<TableHead className="text-center">Prioridad</TableHead>
					<TableHead className="text-center">Acumulable</TableHead>
					<TableHead className="text-right">Activa</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{promotions.map((promotion) => (
					<TableRow key={promotion.id}>
						<TableCell className="whitespace-normal">
							<span className="font-medium text-sm text-foreground">
								{promotion.name}
							</span>
						</TableCell>
						<TableCell>
							<Badge variant="outline">
								{PROMOTION_TYPE_LABELS[promotion.type]}
							</Badge>
						</TableCell>
						<TableCell className="whitespace-normal text-sm text-muted-foreground">
							{formatCondition(promotion)}
						</TableCell>
						<TableCell>
							<span className="font-semibold text-sm">
								{formatEffect(promotion)}
							</span>
						</TableCell>
						<TableCell className="text-center text-sm tabular-nums">
							{promotion.priority}
						</TableCell>
						<TableCell className="text-center">
							<Badge variant={promotion.stackable ? "secondary" : "outline"}>
								{promotion.stackable ? "Sí" : "No"}
							</Badge>
						</TableCell>
						<TableCell className="text-right">
							<Switch
								checked={promotion.isActive}
								disabled
								aria-label="Estado de la promoción"
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function formatCondition(promotion: PromotionView) {
	if (promotion.condition.type === PromotionType.SEASONAL) {
		const from = new Date(promotion.condition.dateFrom).toLocaleDateString(
			"es-ES",
		);
		const to = new Date(promotion.condition.dateTo).toLocaleDateString("es-ES");
		return `${from} - ${to}`;
	}

	if (promotion.condition.type === PromotionType.CUSTOMER_SPECIFIC) {
		return `Cliente ${promotion.condition.customerId}`;
	}

	return "Se aplica con cupón";
}

function formatEffect(promotion: PromotionView) {
	if (promotion.effect.type === PricingRuleEffectType.PERCENTAGE) {
		return `${promotion.effect.value}%`;
	}

	return `$${promotion.effect.value}`;
}
