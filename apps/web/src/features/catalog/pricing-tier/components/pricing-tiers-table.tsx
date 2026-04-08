import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { PricingTierFormValues } from "../schemas/pricing-tier-form.schema";

interface Tier {
	id: string;
	fromUnit: number;
	toUnit: number | null;
	pricePerUnit: string;
	location: {
		name: string;
	};
}

export function PricingTiersTable({
	tiers,
	pendingTiers,
	billingUnitLabel,
}: {
	tiers: Tier[];
	pendingTiers: PricingTierFormValues[];
	billingUnitLabel: string;
}) {
	if (tiers.length === 0) {
		<EmptyState message="No pricing tiers configured. Add one to make this bundle purchasable." />;
	}

	return (
		<Table>
			<TableHeader>
				<TableRow className="hover:bg-transparent">
					{["From", "To", "Location", `Price / ${billingUnitLabel}`, ""].map(
						(h, i) => (
							<TableHead
								key={i}
								className="text-muted-foreground text-xs font-semibold uppercase tracking-wider"
							>
								{h}
							</TableHead>
						),
					)}
				</TableRow>
			</TableHeader>

			<TableBody>
				{/* Persisted tiers */}
				{tiers.map((tier) => (
					<TableRow key={tier.id}>
						<TableCell className="text-sm tabular-nums">
							{tier.fromUnit}
						</TableCell>
						<TableCell className="text-sm tabular-nums">
							{tier.toUnit == null ? (
								<span className="text-muted-foreground">∞</span>
							) : (
								tier.toUnit
							)}
						</TableCell>
						<TableCell className="text-sm">
							{tier.location ? (
								tier.location.name
							) : (
								<span className="text-muted-foreground">Global (Default)</span>
							)}
						</TableCell>
						<TableCell className="font-mono text-sm">
							{tier.pricePerUnit}
						</TableCell>
						<TableCell />
					</TableRow>
				))}

				{/* Pending tiers — visually distinguished */}
				{pendingTiers.map((tier, index) => (
					<TableRow
						key={`pending-${index}`}
						className="bg-muted/40 text-muted-foreground"
					>
						<TableCell className="text-sm tabular-nums">
							{tier.fromUnit}
						</TableCell>
						<TableCell className="text-sm tabular-nums">
							{tier.toUnit == null ? <span>∞</span> : tier.toUnit}
						</TableCell>
						<TableCell className="text-sm">
							{tier.locationId === "global"
								? "Global (Default)"
								: tier.locationId}
						</TableCell>
						<TableCell className="font-mono text-sm">
							{tier.pricePerUnit}
						</TableCell>
						<TableCell>
							<span className="text-xs font-medium">Unsaved</span>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function EmptyState({ message }: { message: string }) {
	return (
		<div className="border-border rounded-xl border border-dashed px-6 py-10 text-center">
			<p className="text-muted-foreground text-sm">{message}</p>
		</div>
	);
}
