import type {
	AssetGroupResponseDto,
	AssetResponseDto,
	GetAssetsQuery,
	PaginationMeta,
} from "@repo/schemas";
import type { PaginationState } from "@tanstack/react-table";
import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronRight as ChevronRightIcon,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { AssetsToolbar } from "./assets-toolbar";
import { BulkAssetAssignmentDialog } from "./bulk-asset-assignment-dialog";

interface AssetsTableProps {
	groups: AssetGroupResponseDto[];
	meta: PaginationMeta | undefined;
	pagination: PaginationState;
	onPaginationChange: Dispatch<SetStateAction<PaginationState>>;
	filters: GetAssetsQuery;
	defaultFilters: GetAssetsQuery;
	onFiltersChange: (filters: GetAssetsQuery) => void;
	isFetching: boolean;
}

function TableSkeleton({ rows = 8 }: { rows?: number }) {
	return (
		<>
			{Array.from({ length: rows }, (_, rowIndex) => `row-${rowIndex}`).map(
				(rowKey) => (
					<TableRow key={rowKey}>
						<TableCell>
							<Skeleton className="h-4 w-4" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-56" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-32" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-32" />
						</TableCell>
						<TableCell>
							<Skeleton className="h-4 w-20" />
						</TableCell>
					</TableRow>
				),
			)}
		</>
	);
}

export function AssetsTable({
	groups,
	meta,
	pagination,
	onPaginationChange,
	filters,
	defaultFilters,
	onFiltersChange,
	isFetching,
}: AssetsTableProps) {
	const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
	const [collapsedGroups, setCollapsedGroups] = useState<
		Record<string, boolean>
	>({});
	const [activeDialog, setActiveDialog] = useState<
		"blackout" | "maintenance" | null
	>(null);

	const selectedAssetIds = Object.entries(rowSelection)
		.filter(([, isSelected]) => Boolean(isSelected))
		.map(([assetId]) => assetId);

	const pageAssetIds = groups.flatMap((group) =>
		group.assets.map((asset) => asset.id),
	);

	const allPageAssetsSelected =
		pageAssetIds.length > 0 &&
		pageAssetIds.every((assetId) => rowSelection[assetId]);
	const somePageAssetsSelected =
		!allPageAssetsSelected &&
		pageAssetIds.some((assetId) => rowSelection[assetId]);

	function setSelectedAssets(nextSelectedIds: string[]) {
		setRowSelection(
			nextSelectedIds.reduce<Record<string, boolean>>((acc, assetId) => {
				acc[assetId] = true;
				return acc;
			}, {}),
		);
	}

	function handleSelectionChange(updater: (previous: string[]) => string[]) {
		setSelectedAssets(updater(selectedAssetIds));
	}

	function toggleAssetSelection(assetId: string, checked: boolean) {
		handleSelectionChange((previous) => {
			if (checked) {
				return previous.includes(assetId) ? previous : [...previous, assetId];
			}

			return previous.filter((selectedId) => selectedId !== assetId);
		});
	}

	function toggleGroupSelection(
		group: AssetGroupResponseDto,
		checked: boolean,
	) {
		handleSelectionChange((previous) => {
			const next = new Set(previous);

			for (const asset of group.assets) {
				if (checked) {
					next.add(asset.id);
				} else {
					next.delete(asset.id);
				}
			}

			return [...next];
		});
	}

	function togglePageSelection(checked: boolean) {
		handleSelectionChange((previous) => {
			const next = new Set(previous);

			for (const assetId of pageAssetIds) {
				if (checked) {
					next.add(assetId);
				} else {
					next.delete(assetId);
				}
			}

			return [...next];
		});
	}

	function clearSelection() {
		setRowSelection({});
	}

	function toggleGroupExpansion(groupId: string) {
		setCollapsedGroups((previous) => ({
			...previous,
			[groupId]: !previous[groupId],
		}));
	}

	return (
		<div className="space-y-4">
			<AssetsToolbar
				filters={filters}
				defaultFilters={defaultFilters}
				onFiltersChange={onFiltersChange}
			/>

			{selectedAssetIds.length > 0 ? (
				<div className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="text-sm text-muted-foreground">
						{selectedAssetIds.length} asset
						{selectedAssetIds.length === 1 ? "" : "s"} seleccionados.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button size="sm" onClick={() => setActiveDialog("blackout")}>
							Crear blackout
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setActiveDialog("maintenance")}
						>
							Crear maintenance
						</Button>
						<Button size="sm" variant="ghost" onClick={clearSelection}>
							Limpiar selección
						</Button>
					</div>
				</div>
			) : null}

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-12">
								<div className="flex items-center justify-center">
									<Checkbox
										checked={allPageAssetsSelected}
										indeterminate={somePageAssetsSelected}
										onCheckedChange={(checked) =>
											togglePageSelection(Boolean(checked))
										}
										aria-label="Seleccionar assets de la pagina"
									/>
								</div>
							</TableHead>
							<TableHead>Asset</TableHead>
							<TableHead>Location</TableHead>
							<TableHead>Dueño</TableHead>
							<TableHead>Estado</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{isFetching ? (
							<TableSkeleton rows={pagination.pageSize} />
						) : groups.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-32 text-center text-muted-foreground"
								>
									No assets found.
								</TableCell>
							</TableRow>
						) : (
							groups.map((group) => {
								const groupAssetIds = group.assets.map((asset) => asset.id);
								const selectedGroupAssets = groupAssetIds.filter(
									(assetId) => rowSelection[assetId],
								);
								const isGroupSelected =
									groupAssetIds.length > 0 &&
									selectedGroupAssets.length === groupAssetIds.length;
								const isGroupIndeterminate =
									selectedGroupAssets.length > 0 && !isGroupSelected;
								const isCollapsed =
									collapsedGroups[group.productType.id] ?? false;

								return (
									<GroupRows
										key={group.productType.id}
										group={group}
										isCollapsed={isCollapsed}
										isGroupSelected={isGroupSelected}
										isGroupIndeterminate={isGroupIndeterminate}
										onToggleGroupSelection={toggleGroupSelection}
										onToggleGroupExpansion={toggleGroupExpansion}
										onToggleAssetSelection={toggleAssetSelection}
										selectedAssetIds={rowSelection}
									/>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between px-1">
				<p className="text-sm text-muted-foreground">
					{meta
						? `${meta.total} product type${meta.total !== 1 ? "s" : ""} · Page ${meta.page} of ${meta.totalPages}`
						: null}
				</p>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							onPaginationChange((previous) => ({
								...previous,
								pageIndex: Math.max(previous.pageIndex - 1, 0),
							}))
						}
						disabled={!meta || meta.page <= 1 || isFetching}
					>
						<ChevronLeft className="h-4 w-4" />
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							onPaginationChange((previous) => ({
								...previous,
								pageIndex: previous.pageIndex + 1,
							}))
						}
						disabled={!meta || meta.page >= meta.totalPages || isFetching}
					>
						Next
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{activeDialog ? (
				<BulkAssetAssignmentDialog
					mode={activeDialog}
					open={activeDialog !== null}
					onOpenChange={(open) => {
						if (!open) {
							setActiveDialog(null);
						}
					}}
					selectedAssetIds={selectedAssetIds}
					onSelectionChange={handleSelectionChange}
					onSuccess={clearSelection}
				/>
			) : null}
		</div>
	);
}

interface GroupRowsProps {
	group: AssetGroupResponseDto;
	isCollapsed: boolean;
	isGroupSelected: boolean;
	isGroupIndeterminate: boolean;
	onToggleGroupSelection: (
		group: AssetGroupResponseDto,
		checked: boolean,
	) => void;
	onToggleGroupExpansion: (groupId: string) => void;
	onToggleAssetSelection: (assetId: string, checked: boolean) => void;
	selectedAssetIds: Record<string, boolean>;
}

function GroupRows({
	group,
	isCollapsed,
	isGroupSelected,
	isGroupIndeterminate,
	onToggleGroupSelection,
	onToggleGroupExpansion,
	onToggleAssetSelection,
	selectedAssetIds,
}: GroupRowsProps) {
	return (
		<>
			<TableRow className="bg-muted/30 hover:bg-muted/30">
				<TableCell>
					<div className="flex items-center justify-center">
						<Checkbox
							checked={isGroupSelected}
							indeterminate={isGroupIndeterminate}
							onCheckedChange={(checked) =>
								onToggleGroupSelection(group, Boolean(checked))
							}
							aria-label={`Seleccionar assets del product type ${group.productType.name}`}
						/>
					</div>
				</TableCell>
				<TableCell colSpan={4}>
					<button
						type="button"
						className="flex w-full items-center gap-3 text-left"
						onClick={() => onToggleGroupExpansion(group.productType.id)}
					>
						{isCollapsed ? (
							<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						)}
						<div className="min-w-0">
							<p className="font-medium">{group.productType.name}</p>
							<p className="text-sm text-muted-foreground">
								{group.assetCount} matching asset
								{group.assetCount === 1 ? "" : "s"}
								{group.productType.description
									? ` · ${group.productType.description}`
									: ""}
							</p>
						</div>
						<Badge variant="outline" className="ml-auto">
							{group.productType.trackingMode}
						</Badge>
					</button>
				</TableCell>
			</TableRow>

			{isCollapsed
				? null
				: group.assets.map((asset) => (
						<AssetRow
							key={asset.id}
							asset={asset}
							isSelected={Boolean(selectedAssetIds[asset.id])}
							onToggleSelection={onToggleAssetSelection}
						/>
					))}
		</>
	);
}

function AssetRow({
	asset,
	isSelected,
	onToggleSelection,
}: {
	asset: AssetResponseDto;
	isSelected: boolean;
	onToggleSelection: (assetId: string, checked: boolean) => void;
}) {
	return (
		<TableRow data-state={isSelected ? "selected" : undefined}>
			<TableCell>
				<div className="flex items-center justify-center">
					<Checkbox
						checked={isSelected}
						onCheckedChange={(checked) =>
							onToggleSelection(asset.id, Boolean(checked))
						}
						aria-label={`Seleccionar asset ${asset.id}`}
					/>
				</div>
			</TableCell>
			<TableCell>
				<div className="pl-7">
					<p className="font-medium font-mono text-sm">
						{asset.serialNumber ?? asset.id}
					</p>
					{asset.notes ? (
						<p className="text-sm text-muted-foreground">{asset.notes}</p>
					) : null}
				</div>
			</TableCell>
			<TableCell>{asset.location.name}</TableCell>
			<TableCell>
				<span className="text-muted-foreground">
					{asset.owner?.name ?? "—"}
				</span>
			</TableCell>
			<TableCell>
				<AssetStatusBadge isActive={asset.isActive} />
			</TableCell>
		</TableRow>
	);
}

function AssetStatusBadge({ isActive }: { isActive: boolean }) {
	if (isActive) {
		return <Badge variant="secondary">Active</Badge>;
	}

	return <Badge variant="destructive">Inactive</Badge>;
}
