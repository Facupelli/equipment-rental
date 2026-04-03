import type { PricingRuleView } from "@repo/schemas";
import { MoreHorizontal, Trash2 } from "lucide-react";
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
import { formatCondition, formatEffect } from "../pricing-rules.utils";

const SCOPE_LABELS: Record<string, string> = {
	FLEET: "Toda la Flota",
	CATEGORY: "Categoría",
	VEHICLE: "Vehículo",
};

// ── Main component ────────────────────────────────────────────────────────────

interface PricingRulesTableProps {
	rules: PricingRuleView[];
	onDelete: (rule: PricingRuleView) => void;
}

export function PricingRulesTable({ rules, onDelete }: PricingRulesTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Tipo de Regla</TableHead>
					<TableHead>Alcance</TableHead>
					<TableHead>Resumen Condición</TableHead>
					<TableHead>Efecto</TableHead>
					<TableHead className="text-center">Prioridad</TableHead>
					<TableHead className="text-right">Estado</TableHead>
					<TableHead className="w-16 text-right">Acciones</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{rules.map((rule) => (
					<TableRow key={rule.id} className="group">
						<TableCell>
							<RuleTypeCell rule={rule} />
						</TableCell>
						<TableCell>
							<ScopeCell scope={rule.scope} />
						</TableCell>
						<TableCell className="text-sm text-muted-foreground">
							{formatCondition(rule.condition)}
						</TableCell>
						<TableCell>
							<EffectCell rule={rule} />
						</TableCell>
						<TableCell className="text-center text-sm tabular-nums">
							{rule.priority}
						</TableCell>
						<TableCell className="text-right">
							<Switch
								checked={rule.isActive}
								disabled
								aria-label="Estado de regla"
							/>
						</TableCell>
						<TableCell className="text-right">
							<RowActions onDelete={() => onDelete(rule)} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function RowActions({ onDelete }: { onDelete: () => void }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						aria-label="Abrir acciones de regla"
					>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuItem variant="destructive" onClick={onDelete}>
					<Trash2 className="h-4 w-4" />
					Eliminar
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function RuleTypeCell({ rule }: { rule: PricingRuleView }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="font-medium text-sm text-foreground leading-tight">
				{rule.name}
			</span>
			<span className="text-xs text-muted-foreground">
				{rule.stackable ? "Apilable" : "No Apilable"}
			</span>
		</div>
	);
}

function ScopeCell({ scope }: { scope: string }) {
	return (
		<Badge
			variant="outline"
			className="text-xs font-medium uppercase tracking-wide"
		>
			{SCOPE_LABELS[scope] ?? scope}
		</Badge>
	);
}

function EffectCell({ rule }: { rule: PricingRuleView }) {
	if (rule.condition.type === "DURATION") {
		return <span className="text-sm text-muted-foreground">—</span>;
	}
	return (
		<span className="font-semibold text-sm">{formatEffect(rule.effect)}</span>
	);
}
