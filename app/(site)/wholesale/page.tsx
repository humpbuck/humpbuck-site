import Link from "next/link";
import { Mail, MessageCircle, Package, PenTool, Truck } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/whatsapp";

export const metadata = {
  title: "Wholesale — DIGI-TEMP & RM-TONNEAU programs",
  description:
    "B2B programs for HUMPBUCK lines: DIGI-TEMP ana-digi and RM-TONNEAU tonneau — MOQ tiers, sampling, dial and packaging customization.",
};

const steps = [
  { icon: Mail, title: "Brief", body: "Share market, price band, and timeline." },
  { icon: PenTool, title: "Mockups", body: "Dial marks, strap colors, packaging." },
  { icon: Package, title: "Sampling", body: "Prototype batch before mass run." },
  { icon: Truck, title: "Production", body: "QC, packing, and tracked dispatch." },
] as const;

export default function WholesalePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
          B2B
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
          Wholesale & custom branding
        </h1>
        <p className="mt-4 text-lg text-muted">
          Scale <strong className="font-medium text-ink/90">DIGI-TEMP</strong>{" "}
          ana-digi or <strong className="font-medium text-ink/90">RM-TONNEAU</strong>{" "}
          barrel-case programs with clear MOQ tiers, sampling milestones, and
          brand-ready packaging.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        <div className="rounded-3xl border border-[color:var(--color-line)] bg-white/70 p-6 shadow-[var(--shadow-card)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            MOQ starting points
          </div>
          <ul className="mt-4 space-y-2 text-sm text-ink/85">
            <li>Express lane: 100–300 units</li>
            <li>Growth lane: 300–800 units</li>
            <li>Brand lane: 800+ with deeper customization</li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            Exact MOQs depend on dial complexity, materials, and packaging.
          </p>
        </div>
        <div className="rounded-3xl border border-[color:var(--color-line)] bg-white/70 p-6 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            What you can customize
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Logo placement · caseback · crown",
              "Dial layout and surface finishes",
              "Hands, indices, and luminous fills",
              "Strap material · colors · hardware",
              "Box · sleeve · warranty card",
            ].map((t) => (
              <div
                key={t}
                className="rounded-2xl border border-[color:var(--color-line)] bg-paper px-4 py-3 text-sm"
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="rounded-3xl border border-[color:var(--color-line)] bg-paper p-6"
          >
            <Icon className="text-luxe-dim" size={22} strokeWidth={1.75} />
            <div className="mt-4 font-serif text-lg">{title}</div>
            <p className="mt-2 text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-[28px] border border-[color:var(--color-line)] bg-ink p-8 text-paper sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="font-serif text-2xl">Start with a structured brief</h2>
            <p className="mt-3 text-sm text-white/70">
              Email works—but WhatsApp is fastest for photos, references, and
              quick iterations.
            </p>
            <form className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                  Company / project name
                </span>
                <input className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35" />
              </label>
              <label>
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                  Target region
                </span>
                <input className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35" />
              </label>
              <label>
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                  Estimated qty
                </span>
                <input className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.16em] text-white/50">
                  Notes
                </span>
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-white/35"
                  placeholder="Materials, references, deadline…"
                />
              </label>
            </form>
            <p className="mt-4 text-xs text-white/45">
              Demo form—wire to your CRM or email endpoint before launch.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[color:var(--color-luxe)] px-6 py-4 text-[12px] font-bold uppercase tracking-[0.14em] text-[#1a1306] transition hover:bg-[color:var(--color-luxe)]/90"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/90"
            >
              <Mail size={18} />
              Email mockup request
            </button>
            <Link
              href="/shop"
              className="text-center text-[12px] text-white/60 underline-offset-4 hover:text-white hover:underline"
            >
              Browse retail catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
