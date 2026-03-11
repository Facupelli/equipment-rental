import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { CheckCircle2, Mail, CalendarCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const orderConfirmationSearchSchema = z.object({
  pickupDate: z.string().catch("—"),
  pickupLocation: z.string().catch("—"),
});

export const Route = createFileRoute("/_portal/order-confirmation/")({
  validateSearch: orderConfirmationSearchSchema,
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { pickupDate, pickupLocation } = Route.useSearch();

  const formattedDate = formatPickupDate(pickupDate);

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center ">
      {/* ── Top bar ── */}
      <header className="w-full bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-neutral-900">
          <p className="text-xl font-bold text-primary">EQUIP</p>
        </div>
        <Button
          className="text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
          nativeButton={false}
          render={
            <Link to="/rental" className="bg-transparent hover:bg-transparent">
              <X className="size-5" />
            </Link>
          }
        ></Button>
      </header>

      {/* ── Card ── */}
      <main className="w-full max-w-lg px-4 py-12 animate-fade-in-up">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 px-8 py-10 flex flex-col items-center gap-6">
          {/* Success icon */}
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-neutral-100" />
            <div className="absolute w-11 h-11 rounded-full bg-neutral-900 flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Your order is confirmed
            </h1>
          </div>

          {/* Next Steps */}
          <div className="w-full space-y-3">
            <p className="text-sm font-semibold text-neutral-700">Next Steps</p>

            <StepCard
              icon={<Mail className="w-4 h-4 text-white" />}
              title="Email confirmation sent"
              description="Check your inbox for full rental details and receipts."
            />

            <StepCard
              icon={<CalendarCheck className="w-4 h-4 text-white" />}
              title={`Ready for pickup on ${formattedDate}`}
              description={`Visit ${pickupLocation} between 9 AM and 6 PM.`}
            />
          </div>

          {/* Actions */}
          <div className="w-full space-y-2 pt-1">
            <Button
              className="w-full bg-neutral-900 hover:bg-neutral-700 text-white font-semibold rounded-xl h-12 text-sm tracking-wide transition-colors"
              nativeButton={false}
              render={<Link to="/rental">Return to Catalog</Link>}
            />
          </div>

          {/* Thumbnail strip placeholder */}
          <ThumbnailStrip />
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="pb-8 text-xs text-neutral-400">
        Need help?{" "}
        <a
          href="mailto:support@luxerentals.com"
          className="underline underline-offset-2 hover:text-neutral-600 transition-colors"
        >
          Contact support@luxerentals.com
        </a>
      </footer>
    </div>
  );
}

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function StepCard({ icon, title, description }: StepCardProps) {
  return (
    <div className="flex items-start gap-4 bg-neutral-50 rounded-xl px-4 py-3.5 border border-neutral-100">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-800">{title}</p>
        <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function ThumbnailStrip() {
  return (
    <div className="w-full grid grid-cols-3 gap-2 pt-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="aspect-3/4 rounded-xl bg-linear-to-br from-neutral-200 to-neutral-300"
        />
      ))}
    </div>
  );
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into a human-readable label.
 * Falls back gracefully if the string is invalid.
 */
function formatPickupDate(dateStr: string): string {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}
