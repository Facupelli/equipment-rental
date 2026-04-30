import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PublicSigningPdfViewerProps = {
	src: string;
	documentNumber: string;
};

export function PublicSigningPdfViewer({
	src,
	documentNumber,
}: PublicSigningPdfViewerProps) {
	return (
		<>
			<div className="space-y-2 sm:hidden">
				<div className="flex items-center justify-between gap-3 px-1">
					<p className="text-sm font-semibold text-neutral-950">
						Documento a revisar
					</p>
				</div>
				<div className="overflow-hidden rounded-md border border-neutral-200 bg-white shadow-xs">
					<iframe
						title={`Contrato ${documentNumber}`}
						src={src}
						className="h-[calc(100svh-11rem)] min-h-128 w-full bg-white"
					/>
				</div>
			</div>

			<Card className="hidden border-neutral-200 bg-white sm:block">
				<CardHeader>
					<CardTitle className="text-base font-semibold text-neutral-950 sm:text-lg">
						Documento a revisar
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950/5">
						<iframe
							title={`Contrato ${documentNumber}`}
							src={src}
							className="h-[62svh] w-full bg-white lg:h-[78svh]"
						/>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
