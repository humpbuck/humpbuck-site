import Link from "next/link";
import { Mail, MessageCircle, Package, PenTool, Truck } from "lucide-react";
import { publicSupportEmail } from "@/lib/support-contact";
import { WHATSAPP_URL } from "@/lib/whatsapp";

export const metadata = {
  title: "Wholesale — DIGI-TEMP & RM-TONNEAU programs",
  description:
    "B2B programs for HUMPBUCK lines: DIGI-TEMP ana-digi and RM-TONNEAU tonneau — MOQ tiers, sampling, dial and packaging customization.",
  alternates: {
    canonical: "/wholesale",
  },
};

const steps = [
  { icon: Mail, title: "Brief", body: "Share market, price band, and timeline." },
  { icon: PenTool, title: "Mockups", body: "Dial marks, strap colors, packaging." },
  { icon: Package, title: "Sampling", body: "Prototype batch before mass run." },
  { icon: Truck, title: "Production", body: "QC, packing, and tracked dispatch." },
] as const;

export default function WholesalePage() {
  const supportMail = publicSupportEmail();
  const mailtoMockupHref = `mailto:${supportMail}?subject=${encodeURIComponent(
    "HUMPBUCK wholesale — mockup request",
  )}`;

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
            <li>Express lane: 500–800 pcs</li>
            <li>Growth lane: 800–2,000 pcs</li>
            <li>Brand lane: 2,000+ pcs with deeper customization</li>
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

      <div className="mt-12 rounded-3xl border border-stone-400/25 bg-stone-300/90 p-8 shadow-[var(--shadow-card)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
              Next step
            </p>
            <h2 className="mt-3 font-serif text-2xl text-ink">
              Start with a structured brief
            </h2>
            <p className="mt-3 text-sm text-muted">
              Email works—but WhatsApp is fastest for photos, references, and
              quick iterations.
            </p>
            <form className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Company / project name
                </span>
                <input className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15" />
              </label>
              <label>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Target region
                </span>
                <input className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15" />
              </label>
              <label>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Estimated qty
                </span>
                <input className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Notes
                </span>
                <textarea
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-stone-400/30 bg-paper px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/90 focus:border-digital-dim/45 focus:ring-2 focus:ring-digital/15"
                  placeholder="Materials, references, deadline…"
                />
              </label>
            </form>
            <p className="mt-4 text-xs text-muted">
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
            <a
              href={mailtoMockupHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-400/35 bg-paper px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/90 shadow-sm transition hover:border-ink/20 hover:bg-stone-100/90"
              aria-label={`Email ${supportMail} for a wholesale mockup request`}
            >
              <Mail size={18} />
              Email mockup request
            </a>
            <Link
              href="/shop"
              className="text-center text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Browse retail catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
