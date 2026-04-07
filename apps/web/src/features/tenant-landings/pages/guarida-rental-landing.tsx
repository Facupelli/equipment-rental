import { Link } from "@tanstack/react-router";
import { ArrowRight, Truck, UserCog, Video } from "lucide-react";
import { getResolvedTenantBranding } from "@/features/tenant-branding/tenant-branding";
import { Route } from "@/routes/index";

const SERVICES = [
  {
    icon: <Video size={28} strokeWidth={1.5} />,
    label: "Servicios de Producción",
  },
  { icon: <Truck size={28} strokeWidth={1.5} />, label: "Transporte" },
  {
    icon: <UserCog size={28} strokeWidth={1.5} />,
    label: "Técnicos Especializados",
  },
];

export function GuaridaRentalLandingPage() {
  const { tenantContext } = Route.useRouteContext();
  const branding = getResolvedTenantBranding(tenantContext);

  console.log({ branding });

  if (!branding) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .anim-1 { animation: fadeInUp 0.8s ease forwards; animation-delay: 0.10s; opacity: 0; }
        .anim-2 { animation: fadeInUp 0.8s ease forwards; animation-delay: 0.30s; opacity: 0; }
        .anim-3 { animation: fadeInUp 0.8s ease forwards; animation-delay: 0.50s; opacity: 0; }
        .anim-4 { animation: fadeInUp 0.8s ease forwards; animation-delay: 0.70s; opacity: 0; }
        .anim-5 { animation: fadeInUp 0.8s ease forwards; animation-delay: 0.90s; opacity: 0; }
        .anim-6 { animation: fadeIn   1.0s ease forwards; animation-delay: 1.10s; opacity: 0; }
      `}</style>

      {/* ── Root ── */}
      <section className="relative w-full min-h-screen overflow-hidden ">
        {/* ── Background image: grayscale + lighter than before ── */}
        <img
          src="https://images.pexels.com/photos/2512258/pexels-photo-2512258.jpeg"
          alt="Dark film studio interior"
          className="absolute inset-0 w-full h-full object-cover object-center grayscale brightness-[0.38] contrast-[1.15]"
        />

        {/* ── Dark vignette: edges darker, center breathes ── */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_50%_45%,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.65)_60%,rgba(0,0,0,0.88)_100%)]" />

        {/* ── Grain texture ── */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />

        {/* ── Sidebar coordinate text ── */}
        <div
          className="absolute left-0 top-1/2 flex flex-col items-center gap-2 pl-3 anim-6 select-none"
          style={{
            writingMode: "vertical-rl",
            transform: "translateY(-50%) rotate(180deg)",
          }}
        >
          <span className=" text-[9px] font-light tracking-[0.25em] uppercase text-white/25">
            COORD.REF
          </span>
          <span className=" text-[9px] font-light tracking-[0.2em] text-white/15">
            40.4168° N, 3.7038° W
          </span>
        </div>

        {/* ── Content grid: nav / main / footer ── */}
        <div className="relative z-10 grid grid-rows-[auto_1fr_auto] min-h-screen">
          {/* ── Navbar ── */}
          <nav className="flex items-center justify-between px-6 py-5 bg-black/80 backdrop-blur-sm md:px-10">
            {branding.logoSrc ? (
              // <div className="bg-neutral-50 p-2 rounded-md">
              <img
                src={branding.logoSrc}
                alt={branding.tenantName}
                className="h-12 w-auto max-w-48 object-contain"
              />
            ) : (
              // </div>
              <span className="text-white text-2xl tracking-widest select-none">
                {branding.tenantName}
              </span>
            )}

            <Link
              to="/rental"
              className="
               text-[11px] font-bold tracking-[0.15em] uppercase
               px-6 py-2.5 text-white bg-[#C85C3E]
              transition-colors duration-200 hover:bg-[#a84a2f]
             "
            >
              Ver catálogo
            </Link>
          </nav>

          {/* ── Hero ── */}
          <main className="flex flex-col items-center justify-center text-center px-6 gap-6">
            {/* "MADRID CENTRO" label */}
            <div className="anim-1 flex items-center gap-3">
              <span className="block h-px w-10 bg-[#C85C3E]" />
              <span className=" text-sm font-semibold tracking-[0.35em] uppercase text-[#C85C3E]">
                MADRID CENTRO
              </span>
              <span className="block h-px w-10 bg-[#C85C3E]" />
            </div>

            {/* Main headline */}
            <h1 className="anim-2 text-white leading-none uppercase text-[clamp(3rem,8vw,7.5rem)] tracking-wide">
              No somos un
              <br />
              simple rental
            </h1>

            {/* Subheadline */}
            <p className="anim-3 max-w-4xl text-base font-semibold tracking-[0.2em] uppercase text-white/70 md:text-xl md:tracking-[0.28em]">
              LOS COMBOS MÁS BARATOS DE MADRID
            </p>

            {/* Service icons */}
            <div className="anim-4 mt-4 grid gap-10 md:grid-cols-3 md:gap-16">
              {SERVICES.map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-3">
                  <div className="text-[#C85C3E]">{icon}</div>
                  <span className=" text-base font-light tracking-wider text-white/60">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link to="/rental" className="anim-5 mt-4 flex items-stretch">
              <span
                className="
                  font-bold text-base tracking-[0.18em] uppercase
                 px-10 py-4 text-white bg-[#C85C3E]
                 transition-colors duration-200 hover:bg-[#a84a2f]
               "
              >
                Explorar catálogo
              </span>
              <div className="flex items-center justify-center px-5 bg-white/[0.07] border-l border-white/10">
                <ArrowRight
                  size={18}
                  className="text-white"
                  strokeWidth={1.5}
                />
              </div>
            </Link>
          </main>

          {/* ── Footer ── */}
          <footer className="flex items-end justify-between px-10 py-6">
            <p className=" text-[10px] font-light tracking-[0.18em] uppercase text-white/30">
              ©{new Date().getFullYear()}{" "}
              <strong className="font-semibold text-white/45">
                {branding.tenantName}
              </strong>
              . MADRID.
            </p>

            <a
              href="https://www.instagram.com/guarida.rental/"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/35 transition-colors duration-200 hover:text-white/70"
            >
              Instagram
            </a>
          </footer>
        </div>
      </section>
    </>
  );
}
