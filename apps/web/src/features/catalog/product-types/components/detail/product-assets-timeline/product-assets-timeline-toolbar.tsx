import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
	TimelinePreset,
	TimelineRange,
} from "./product-assets-timeline.utils";
import { formatTimelineRangeLabel } from "./product-assets-timeline.utils";

const TIMELINE_PRESETS: Array<{ value: TimelinePreset; label: string }> = [
	{ value: "day", label: "Dia" },
	{ value: "week", label: "Semana" },
	{ value: "2weeks", label: "2 semanas" },
];

interface ProductAssetsTimelineToolbarProps {
	range: TimelineRange;
	showInactive: boolean;
	onPresetChange: (preset: TimelinePreset) => void;
	onShiftRange: (direction: -1 | 1) => void;
	onJumpToToday: () => void;
	onShowInactiveChange: (showInactive: boolean) => void;
}

export function ProductAssetsTimelineToolbar({
	range,
	showInactive,
	onPresetChange,
	onShiftRange,
	onJumpToToday,
	onShowInactiveChange,
}: ProductAssetsTimelineToolbarProps) {
	return (
		<div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-sm font-medium">Ventana visible</p>
					<p className="text-sm text-muted-foreground">
						{formatTimelineRangeLabel(range)}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<div className="inline-flex items-center rounded-md border bg-background p-1">
						{TIMELINE_PRESETS.map((preset) => (
							<Button
								key={preset.value}
								variant="ghost"
								size="sm"
								onClick={() => onPresetChange(preset.value)}
								className={cn(
									"h-8 rounded-sm px-3",
									range.preset === preset.value
										? "bg-muted text-foreground shadow-sm hover:bg-muted"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{preset.label}
							</Button>
						))}
					</div>

					<Label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
						<Switch
							checked={showInactive}
							onCheckedChange={onShowInactiveChange}
							aria-label="Mostrar assets inactivos"
						/>
						<span>Mostrar inactivos</span>
					</Label>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<Button variant="outline" size="sm" onClick={() => onShiftRange(-1)}>
					<ArrowLeft className="mr-1.5 h-4 w-4" />
					Anterior
				</Button>
				<Button variant="outline" size="sm" onClick={onJumpToToday}>
					<CalendarDays className="mr-1.5 h-4 w-4" />
					Hoy
				</Button>
				<Button variant="outline" size="sm" onClick={() => onShiftRange(1)}>
					Siguiente
					<ArrowRight className="ml-1.5 h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
