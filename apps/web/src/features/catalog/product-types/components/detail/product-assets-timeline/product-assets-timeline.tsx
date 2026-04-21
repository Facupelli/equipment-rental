import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductTimeline } from "@/features/catalog/product-types/products.queries";
import { locationQueries } from "@/features/tenant/locations/locations.queries";
import { useSelectedLocation } from "@/shared/contexts/location/location.hooks";
import {
	getDefaultTimelineRange,
	resolveTimelineRange,
	shiftTimelineRange,
	type TimelinePreset,
} from "./product-assets-timeline.utils";
import { ProductAssetsTimelineGrid } from "./product-assets-timeline-grid";
import { ProductAssetsTimelineToolbar } from "./product-assets-timeline-toolbar";

interface ProductAssetsTimelineProps {
	productTypeId: string;
	timelineSearch: {
		timelinePreset: TimelinePreset;
		timelineFrom?: string;
		timelineTo?: string;
		showInactive: boolean;
	};
	onTimelineSearchChange: (
		updates: Partial<{
			timelinePreset: TimelinePreset;
			timelineFrom: string | undefined;
			timelineTo: string | undefined;
			showInactive: boolean;
		}>,
	) => void;
}

export function ProductAssetsTimeline({
	productTypeId,
	timelineSearch,
	onTimelineSearchChange,
}: ProductAssetsTimelineProps) {
	const { data: locations } = useSuspenseQuery(locationQueries.list());
	const selectedLocation = useSelectedLocation(locations);
	const timezone = selectedLocation?.effectiveTimezone ?? "UTC";
	const range = resolveTimelineRange({
		preset: timelineSearch.timelinePreset,
		timezone,
		from: timelineSearch.timelineFrom,
		to: timelineSearch.timelineTo,
	});

	const { data, isPending, isError } = useProductTimeline(
		{
			productTypeId,
			locationId: selectedLocation?.id ?? productTypeId,
			from: range.from,
			to: range.to,
		},
		{
			enabled: Boolean(selectedLocation),
		},
	);

	const visibleAssets =
		data?.assets.filter(
			(assetRow) => timelineSearch.showInactive || assetRow.asset.isActive,
		) ?? [];

	function updateRange(nextRange: {
		from: string;
		to: string;
		preset: TimelinePreset;
	}) {
		onTimelineSearchChange({
			timelinePreset: nextRange.preset,
			timelineFrom: nextRange.from,
			timelineTo: nextRange.to,
		});
	}

	if (!selectedLocation) {
		return (
			<div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
				Selecciona una ubicacion para ver el timeline de assets.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<ProductAssetsTimelineToolbar
				range={range}
				showInactive={timelineSearch.showInactive}
				onPresetChange={(preset) =>
					updateRange(getDefaultTimelineRange({ preset, timezone }))
				}
				onShiftRange={(direction) =>
					updateRange(shiftTimelineRange(range, direction))
				}
				onJumpToToday={() =>
					updateRange(
						getDefaultTimelineRange({
							preset: timelineSearch.timelinePreset,
							timezone,
						}),
					)
				}
				onShowInactiveChange={(showInactive) =>
					onTimelineSearchChange({ showInactive })
				}
			/>

			{isPending ? (
				<TimelineLoadingState />
			) : isError || !data ? (
				<div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-sm text-muted-foreground">
					<AlertTriangle className="h-4 w-4" />
					No pudimos cargar el timeline del producto.
				</div>
			) : (
				<>
					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
						<SummaryCard label="Assets" value={data.summary.totalAssets} />
						<SummaryCard
							label="Disponibles ahora"
							value={data.summary.availableNow}
						/>
						<SummaryCard label="En pedido" value={data.summary.inOrderNow} />
						<SummaryCard label="Blackout" value={data.summary.inBlackoutNow} />
						<SummaryCard
							label="Mantenimiento"
							value={data.summary.inMaintenanceNow}
						/>
						<SummaryCard
							label={timelineSearch.showInactive ? "Filas visibles" : "Activos"}
							value={
								timelineSearch.showInactive
									? visibleAssets.length
									: data.summary.activeAssets
							}
						/>
					</div>

					<ProductAssetsTimelineGrid
						assets={visibleAssets}
						range={{ ...range, timezone: data.range.timezone }}
						preset={timelineSearch.timelinePreset}
						timezone={data.range.timezone}
					/>
				</>
			)}
		</div>
	);
}

function SummaryCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border bg-card px-4 py-3">
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<p className="pt-2 text-2xl font-semibold">{value}</p>
		</div>
	);
}

function TimelineLoadingState() {
	return (
		<div className="space-y-4">
			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
				{Array.from({ length: 6 }).map((_, index) => (
					// biome-ignore lint: index key is fine here
					<Skeleton key={index} className="h-20 rounded-lg" />
				))}
			</div>
			<Skeleton className="h-130 rounded-lg" />
		</div>
	);
}
