import { CircleCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type PublicSigningCompletionBarProps = {
	signedAtLabel: string;
	downloadHref: string;
};

export function PublicSigningCompletionBar({
	signedAtLabel,
	downloadHref,
}: PublicSigningCompletionBarProps) {
	return (
		<div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 px-3 py-3 shadow-[0_-12px_40px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-6 sm:py-4">
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-xs sm:px-5">
				<div className="flex items-start gap-3">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
						<CircleCheck className="size-5" />
					</div>
					<div className="min-w-0">
						<p className="text-lg font-semibold text-neutral-950">
							Contrato firmado correctamente
						</p>
						<p className="text-sm leading-5 text-neutral-600">
							Registrado el {signedAtLabel}.
						</p>
					</div>
				</div>
				<Button
					className="h-11 w-full gap-2 rounded-full text-sm font-semibold uppercase tracking-wide"
					render={
						<a href={downloadHref} download>
							<Download className="size-4" />
							Descargar PDF firmado
						</a>
					}
				/>
			</div>
		</div>
	);
}
