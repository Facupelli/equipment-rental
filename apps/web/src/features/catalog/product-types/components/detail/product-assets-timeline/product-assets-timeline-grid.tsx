import type {
	ProductTimelineAssetRow,
	ProductTimelineBlock,
} from "@repo/schemas";
import { AssignmentType } from "@repo/types";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
	formatBlockDateTime,
	getBlockLayout,
	getRelativePosition,
	getTimelineCanvasMinWidth,
	getTimelineTicks,
	TIMELINE_ASSET_COLUMN_WIDTH,
	type TimelinePreset,
	type TimelineRange,
} from "./product-assets-timeline.utils";

interface ProductAssetsTimelineGridProps {
	assets: ProductTimelineAssetRow[];
	range: TimelineRange;
	preset: TimelinePreset;
	timezone: string;
}

export function ProductAssetsTimelineGrid({
	assets,
	range,
	preset,
	timezone,
}: ProductAssetsTimelineGridProps) {
	const ticks = getTimelineTicks(range);
	const nowPosition = getNowIndicatorPosition(range);
	const canvasMinWidth = getTimelineCanvasMinWidth(preset);

	if (assets.length === 0) {
		return (
			<div className="rounded-lg border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
				No hay assets para mostrar en este timeline.
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border bg-card">
			<div className="max-h-180 overflow-auto">
				<div
					className="min-w-full"
					style={{
						minWidth: `${TIMELINE_ASSET_COLUMN_WIDTH + canvasMinWidth}px`,
					}}
				>
					<div
						className="sticky top-0 z-30 grid border-b bg-card"
						style={{
							gridTemplateColumns: `${TIMELINE_ASSET_COLUMN_WIDTH}px minmax(${canvasMinWidth}px, 1fr)`,
						}}
					>
						<div className="sticky left-0 z-30 border-r bg-card px-4 py-3">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Activo / ID
							</p>
						</div>
						<div className="relative h-16 bg-card">
							{ticks.map((tick) => (
								<div
									key={tick.key}
									className="absolute inset-y-0"
									style={{ left: `${tick.position}%` }}
								>
									<div className="absolute inset-y-0 w-px bg-border" />
									<div className="absolute left-2 top-2 whitespace-nowrap">
										<p className="text-sm font-medium">{tick.label}</p>
										{tick.secondaryLabel ? (
											<p className="text-xs text-muted-foreground">
												{tick.secondaryLabel}
											</p>
										) : null}
									</div>
								</div>
							))}
							<div className="absolute inset-y-0 right-0 w-px bg-border" />
							{nowPosition !== null ? (
								<div
									className="absolute inset-y-0 z-10 w-px bg-destructive"
									style={{ left: `${nowPosition}%` }}
								/>
							) : null}
						</div>
					</div>

					{assets.map((row) => (
						<div
							key={row.asset.id}
							className="grid border-b last:border-b-0"
							style={{
								gridTemplateColumns: `${TIMELINE_ASSET_COLUMN_WIDTH}px minmax(${canvasMinWidth}px, 1fr)`,
							}}
						>
							<div className="sticky left-0 z-20 border-r bg-card px-4 py-4">
								<div className="space-y-2">
									<div className="flex items-center gap-2">
										<p className="font-medium text-sm">
											{row.asset.serialNumber ?? row.asset.id.slice(0, 8)}
										</p>
										<Badge
											variant={row.asset.isActive ? "secondary" : "destructive"}
										>
											{row.asset.isActive ? "Activo" : "Inactivo"}
										</Badge>
									</div>
									{row.asset.owner && (
										<p className="text-xs text-muted-foreground">
											{row.asset.owner.name}
										</p>
									)}
									{row.asset.notes ? (
										<p className="line-clamp-2 text-xs text-muted-foreground">
											{row.asset.notes}
										</p>
									) : null}
								</div>
							</div>

							<div className="relative h-22 bg-background/40">
								{ticks.map((tick) => (
									<div
										key={tick.key}
										className={cn(
											"absolute inset-y-0 w-px",
											tick.isMajor ? "bg-border" : "bg-border/50",
										)}
										style={{ left: `${tick.position}%` }}
									/>
								))}
								<div className="absolute inset-y-3 left-0 right-0 rounded-md border border-dashed border-border/60 bg-muted/20" />
								{nowPosition !== null ? (
									<div
										className="absolute inset-y-0 z-10 w-px bg-destructive"
										style={{ left: `${nowPosition}%` }}
									/>
								) : null}
								{row.timeline.map((block) => {
									const layout = getBlockLayout(block, range);

									if (!layout) {
										return null;
									}

									return (
										<TimelineBlockChip
											key={block.id}
											block={block}
											layout={layout}
											timezone={timezone}
										/>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function TimelineBlockChip({
	block,
	layout,
	timezone,
}: {
	block: ProductTimelineBlock;
	layout: NonNullable<ReturnType<typeof getBlockLayout>>;
	timezone: string;
}) {
	const blockClasses = getBlockClasses(block);

	return (
		<Popover>
			<PopoverTrigger
				className={cn(
					"absolute top-4 flex h-10 min-w-0 items-center rounded-md border px-3 text-left text-xs font-medium text-white shadow-sm transition hover:brightness-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
					blockClasses,
				)}
				style={{
					left: `${layout.left}%`,
					width: `${layout.width}%`,
				}}
			>
				<span className="truncate">{block.label}</span>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="start">
				<PopoverHeader>
					<PopoverTitle>{block.label}</PopoverTitle>
					<PopoverDescription>
						{getBlockTypeLabel(block.type)}
					</PopoverDescription>
				</PopoverHeader>

				<div className="space-y-3 text-sm">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline">{getBlockStatusLabel(block.status)}</Badge>
						{layout.isClippedStart || layout.isClippedEnd ? (
							<Badge variant="outline">Continua fuera de la vista</Badge>
						) : null}
					</div>

					<div className="space-y-1 text-muted-foreground">
						<p>Inicio: {formatBlockDateTime(block.startsAt, timezone)}</p>
						<p>Fin: {formatBlockDateTime(block.endsAt, timezone)}</p>
					</div>

					{block.order ? (
						<div className="rounded-md border p-3">
							<p className="font-medium">Pedido #{block.order.number}</p>
							<p className="text-muted-foreground text-sm">
								Estado: {block.order.status}
							</p>
							<p className="text-muted-foreground text-sm">
								Cliente: {block.order.customer?.displayName ?? "Sin cliente"}
							</p>
						</div>
					) : null}

					{block.reason ? (
						<div className="rounded-md border p-3">
							<p className="font-medium">Detalle</p>
							<p className="text-muted-foreground text-sm">{block.reason}</p>
						</div>
					) : null}
				</div>
			</PopoverContent>
		</Popover>
	);
}

function getNowIndicatorPosition(range: TimelineRange) {
	const now = new Date().toISOString();
	const position = getRelativePosition(now, range);

	if (position < 0 || position > 100) {
		return null;
	}

	return position;
}

function getBlockClasses(block: ProductTimelineBlock) {
	if (block.type === AssignmentType.ORDER) {
		return cn(
			"border-black/90 bg-black",
			block.status === "past" ? "opacity-60" : undefined,
		);
	}

	if (block.type === AssignmentType.BLACKOUT) {
		return cn(
			"border-zinc-500/80 bg-zinc-600",
			block.status === "past" ? "opacity-60" : undefined,
		);
	}

	if (block.type === AssignmentType.MAINTENANCE) {
		return cn(
			"border-amber-800/80 bg-[repeating-linear-gradient(135deg,rgba(146,64,14,1)_0px,rgba(146,64,14,1)_10px,rgba(180,83,9,1)_10px,rgba(180,83,9,1)_20px)]",
			block.status === "past" ? "opacity-60" : undefined,
		);
	}

	return "border-slate-700/80 bg-slate-700";
}

function getBlockTypeLabel(type: ProductTimelineBlock["type"]) {
	if (type === AssignmentType.ORDER) {
		return "Pedido";
	}

	if (type === AssignmentType.BLACKOUT) {
		return "Blackout";
	}

	if (type === AssignmentType.MAINTENANCE) {
		return "Mantenimiento";
	}

	return type;
}

function getBlockStatusLabel(status: ProductTimelineBlock["status"]) {
	if (status === "active") {
		return "Activo ahora";
	}

	if (status === "upcoming") {
		return "Proximo";
	}

	return "Finalizado";
}
