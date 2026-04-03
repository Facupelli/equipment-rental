import type { BundleListItemResponseDto } from "@repo/schemas";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

const col = createColumnHelper<BundleListItemResponseDto>();

export const bundleColumns = [
	col.accessor("name", {
		header: "Nombre",
		cell: (info) => (
			<div>
				<p className="font-semibold">{info.getValue()}</p>
				<p className="text-muted-foreground text-xs">
					{info.row.original.componentCount}{" "}
					{info.row.original.componentCount === 1 ? "producto" : "productos"}
				</p>
			</div>
		),
	}),

	col.accessor("publishedAt", {
		id: "status",
		header: "Estado",
		cell: (info) => {
			const publishedAt = info.getValue();
			const retiredAt = info.row.original.retiredAt;

			if (!publishedAt && !retiredAt) {
				return (
					<Badge variant="outline" className="text-muted-foreground">
						Borrador
					</Badge>
				);
			}

			if (publishedAt && !retiredAt) {
				return (
					<Badge
						variant="outline"
						className="border-emerald-200 bg-emerald-50 text-emerald-700"
					>
						Activo
					</Badge>
				);
			}

			if (publishedAt && retiredAt) {
				return (
					<Badge
						variant="outline"
						className="border-amber-200 bg-amber-50 text-amber-700"
					>
						Retirado
					</Badge>
				);
			}

			// Fallback (retired but not published - edge case)
			return (
				<Badge variant="outline" className="text-muted-foreground">
					Inactivo
				</Badge>
			);
		},
	}),

	col.accessor("billingUnit", {
		header: "Unidad de cobro",
		cell: (info) => (
			<span className="text-muted-foreground text-sm">
				{info.getValue().label}
			</span>
		),
	}),

	col.accessor("basePrice", {
		header: "Precio",
		cell: (info) => {
			const price = info.getValue();
			return <span className="text-sm">{price != null ? price : "—"}</span>;
		},
	}),
];
