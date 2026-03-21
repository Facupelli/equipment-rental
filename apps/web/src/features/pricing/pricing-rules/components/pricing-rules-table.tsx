import type { PricingRuleView } from "@repo/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatCondition, formatEffect } from "../pricing-rules.utils";

const SCOPE_LABELS: Record<string, string> = {
  FLEET: "Toda la Flota",
  CATEGORY: "Categoría",
  VEHICLE: "Vehículo",
};

// ── Main component ────────────────────────────────────────────────────────────

interface PricingRulesTableProps {
  rules: PricingRuleView[];
}

export function PricingRulesTable({ rules }: PricingRulesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="text-xs uppercase tracking-widest text-muted-foreground">
          <TableHead className="w-55">Tipo de Regla</TableHead>
          <TableHead>Alcance</TableHead>
          <TableHead>Resumen Condición</TableHead>
          <TableHead>Efecto</TableHead>
          <TableHead className="text-center">Prioridad</TableHead>
          <TableHead className="text-right">Estado</TableHead>
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RuleTypeCell({ rule }: { rule: PricingRuleView }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-medium text-sm text-foreground leading-tight">
        {rule.name}
      </span>
      <span className="text-xs text-muted-foreground">
        {rule.stackable ? "Apilable" : "Automático"}
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
  return (
    <span className="font-semibold text-sm">{formatEffect(rule.effect)}</span>
  );
}
