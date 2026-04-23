import Link from "next/link";
import { PolicyContactCard } from "@/components/site/PolicyContactCard";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

export const metadata = {
  title: "Shipping & tax",
  description:
    "Shipping policy, processing times, tracking, customs, taxes, and contact — HUMPBUCK.",
  alternates: {
    canonical: "/shipping",
  },
};

const linkContact =
  "font-medium text-blue-700 underline decoration-blue-700/30 underline-offset-[3px] transition hover:text-blue-800 hover:decoration-blue-800/50";

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-4xl tracking-tight text-ink">
        Shipping & tax
      </h1>

      <div className="mt-8 space-y-6 text-sm leading-[1.65] text-ink/85">
        <p>
          At{" "}
          <a
            href="https://humpbuck.com/"
            className={linkContact}
            target="_blank"
            rel="noopener noreferrer"
          >
            https://humpbuck.com/
          </a>{" "}
          (“We”, “Site”), we are committed to ensuring your orders are delivered
          in a timely and efficient manner. This policy outlines our shipping
          processes, tax practices, and specific customs requirements for certain
          regions.
        </p>
      </div>

      <hr className="my-10 border-[color:var(--color-line)]" />

      <div className="space-y-12 text-sm leading-[1.65] text-ink/85">
        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Processing time
          </h2>
          <p className="mt-4 text-ink/85">
            Most orders placed before{" "}
            <strong>5:00 p.m. ET (Monday – Friday)</strong> are shipped within{" "}
            <strong>3 working days</strong>. Orders placed on weekends or
            holidays will be processed the next business day. For security
            purposes, initial orders or those with alternate shipping addresses
            may require additional verification time.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Shipping options & charges
          </h2>
          <p className="mt-4 text-ink/85">
            We offer <strong>free shipping</strong> to most countries. For
            specific regions requiring a shipping fee, the amount will be
            automatically calculated and clearly displayed on your order form
            before checkout.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Order tracking
          </h2>
          <p className="mt-4 text-ink/85">
            Stay informed about your delivery every step of the way:
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>
              <strong>Online tracking:</strong> Once shipped, we will provide a
              tracking number for online lookup.
            </li>
            <li>
              <strong>WhatsApp notifications:</strong> For your convenience,
              tracking details and order updates will be sent to you via{" "}
              <strong>WhatsApp</strong>.
            </li>
            <li>
              <strong>Email updates:</strong> You will also receive status
              updates and estimated delivery dates via email.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Special customs requirements (India, Brazil, etc.)
          </h2>
          <p className="mt-4 text-ink/85">
            Certain countries require buyers to submit personal customs clearance
            information in advance.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            For India customers (KYC requirements)
          </h2>
          <p className="mt-4 text-ink/85">
            To ensure smooth customs clearance, Indian regulations require{" "}
            <strong>KYC (Know Your Customer)</strong> documents.
          </p>
          <ol className="mt-6 list-decimal space-y-6 pl-5 text-ink/85 marker:font-semibold">
            <li>
              <strong>Required documents:</strong> Please provide a clear copy
              of <strong>one</strong> of the following:
              <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-ink/40">
                <li>Aadhaar Card, Voter ID, or Passport.</li>
                <li className="italic text-ink/75">
                  Note: Documents must show both the <strong>Front</strong>{" "}
                  (photo and DOB) and <strong>Back</strong> (detailed address).
                </li>
              </ul>
            </li>
            <li>
              <strong>Submission process:</strong> Our local partners may contact
              you via WhatsApp, phone, or email. Please send your{" "}
              <strong>Tracking Number (Format: CNIN + 11 digits)</strong> and the{" "}
              <strong>KYC images</strong> to:{" "}
              <a href="mailto:kyc@morningglobal.com" className={linkContact}>
                kyc@morningglobal.com
              </a>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Taxes & duties
          </h2>
          <p className="mt-4 text-ink/85">
            Sales tax is collected based on the destination country&apos;s
            regulations. These charges are automatically calculated at checkout.
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>
              <strong>Invoices:</strong> If you require a formal invoice, please
              leave a note during payment or contact us via email at{" "}
              <strong>support@humpbuck.com</strong> or{" "}
              <a
                href={WHATSAPP_URL}
                className={linkContact}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp {WHATSAPP_DISPLAY}
              </a>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Delivery issues
          </h2>
          <p className="mt-4 text-ink/85">
            If you encounter any issues with your delivery, please contact us
            immediately. We will coordinate with our carriers to resolve the
            matter as quickly as possible.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Title and risk of loss
          </h2>
          <p className="mt-4 text-ink/85">
            All items purchased are made pursuant to a shipment contract. The
            risk of loss and title for such items pass to you upon our delivery
            of the goods to the carrier.
          </p>
        </section>

        <PolicyContactCard />
      </div>

      <p className="mt-12 border-t border-[color:var(--color-line)] pt-8 text-sm text-muted">
        Related:{" "}
        <Link href="/refund" className="font-medium text-ink underline-offset-4 hover:underline">
          Refund policy
        </Link>
        {" · "}
        <Link
          href="/wholesale"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          Wholesale
        </Link>
      </p>
    </div>
  );
}
