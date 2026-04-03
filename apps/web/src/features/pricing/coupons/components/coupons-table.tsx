import type { CouponView } from "@repo/schemas";
import { MoreHorizontal, Trash2 } from "lucide-react";
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
import { formatCouponUsage, formatCouponValidity } from "../coupons.utils";

interface CouponsTableProps {
	coupons: CouponView[];
	onDelete: (coupon: CouponView) => void;
}

export function CouponsTable({ coupons, onDelete }: CouponsTableProps) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Código</TableHead>
					<TableHead>Regla Vinculada</TableHead>
					<TableHead>Uso</TableHead>
					<TableHead>Validez</TableHead>
					<TableHead className="text-right">Estado</TableHead>
					<TableHead className="w-16 text-right">Acciones</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{coupons.map((coupon) => (
					<TableRow key={coupon.id}>
						<TableCell>
							<CodeCell code={coupon.code} />
						</TableCell>
						<TableCell>
							<LinkedRuleCell name={coupon.pricingRuleName} />
						</TableCell>
						<TableCell>
							<UsageCell coupon={coupon} />
						</TableCell>
						<TableCell className="text-sm text-muted-foreground tabular-nums">
							{formatCouponValidity(coupon)}
						</TableCell>
						<TableCell className="text-right">
							<Switch
								checked={coupon.isActive}
								disabled
								aria-label="Estado del cupón"
							/>
						</TableCell>
						<TableCell className="text-right">
							<RowActions onDelete={() => onDelete(coupon)} />
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
						aria-label="Abrir acciones del cupón"
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

function CodeCell({ code }: { code: string }) {
	return (
		<span className="font-mono font-bold text-sm tracking-wide">{code}</span>
	);
}

function LinkedRuleCell({ name }: { name: string }) {
	return <span className="text-sm text-foreground">{name}</span>;
}

function UsageCell({ coupon }: { coupon: CouponView }) {
	const { label, percentage } = formatCouponUsage(coupon);

	return (
		<div className="flex flex-col gap-1.5 min-w-35">
			<div className="flex items-center justify-between gap-3">
				<span className="text-xs text-muted-foreground">{label}</span>
				{percentage !== null && (
					<span className="text-xs font-medium tabular-nums">
						{percentage}%
					</span>
				)}
			</div>
			{percentage !== null && (
				<div className="h-1 w-full rounded-full bg-muted overflow-hidden">
					<div
						className="h-full rounded-full bg-foreground transition-all"
						style={{ width: `${percentage}%` }}
					/>
				</div>
			)}
		</div>
	);
}
