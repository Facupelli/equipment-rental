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
		<Card className="border-neutral-200 bg-white">
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
						className="h-[56svh] w-full bg-white sm:h-[62svh] lg:h-[78svh]"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
