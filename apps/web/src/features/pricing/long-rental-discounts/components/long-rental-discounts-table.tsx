import type { LongRentalDiscountView } from "@repo/schemas";
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

interface LongRentalDiscountsTableProps {
	discounts: LongRentalDiscountView[];
}

export function LongRentalDiscountsTable({
	discounts,
}: LongRentalDiscountsTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Nombre</TableHead>
					<TableHead>Tramos</TableHead>
					<TableHead className="text-center">Prioridad</TableHead>
					<TableHead className="text-center">Aplicación</TableHead>
					<TableHead className="text-right">Activo</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{discounts.map((discount) => (
					<TableRow key={discount.id}>
						<TableCell>
							<div className="flex flex-col gap-1">
								<span className="font-medium text-sm text-foreground">
									{discount.name}
								</span>
								<span className="text-xs text-muted-foreground">
									Menor número = mayor prioridad.
								</span>
							</div>
						</TableCell>
						<TableCell className="whitespace-normal">
							<div className="flex flex-wrap gap-1.5">
								{discount.tiers.map((tier, index) => (
									<Badge key={`${discount.id}-${index}`} variant="outline">
										{formatTier(tier.fromUnits, tier.toUnits, tier.discountPct)}
									</Badge>
								))}
							</div>
						</TableCell>
						<TableCell className="text-center text-sm tabular-nums">
							{discount.priority}
						</TableCell>
						<TableCell className="text-center">
							<Badge variant="secondary">Automática</Badge>
						</TableCell>
						<TableCell className="text-right">
							<Switch
								checked={discount.isActive}
								disabled
								aria-label="Estado del descuento por alquiler largo"
							/>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function formatTier(
	fromUnits: number,
	toUnits: number | null,
	discountPct: number,
) {
	if (toUnits === null) {
		return `${fromUnits}+ unidades: ${discountPct}%`;
	}

	return `${fromUnits}-${toUnits} unidades: ${discountPct}%`;
}
