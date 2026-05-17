import Link from "next/link";
import { PolicyContactCard } from "@/components/site/PolicyContactCard";
import { WHATSAPP_DISPLAY, WHATSAPP_URL } from "@/lib/whatsapp";

export const metadata = {
  title: "Refund policy",
  description:
    "Returns, exchanges, refunds, and exceptions — HUMPBUCK.",
  alternates: {
    canonical: "/refund",
  },
};

const linkContact =
  "font-medium text-blue-700 underline decoration-blue-700/30 underline-offset-[3px] transition hover:text-blue-800 hover:decoration-blue-800/50";

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-4xl tracking-tight text-ink">
        Refund policy
      </h1>

      <div className="mt-8 space-y-6 text-sm leading-[1.65] text-ink/85">
        <p>
          We have a <strong>30-day return policy</strong>, which means you have
          30 days after receiving your item to request a return.
        </p>
        <p>
          To be eligible for a return, your item must be in the same condition
          that you received it, unworn or unused, with tags, and in its original
          packaging. You&apos;ll also need the receipt or proof of purchase.
        </p>
      </div>

      <hr className="my-10 border-line" />

      <div className="space-y-12 text-sm leading-[1.65] text-ink/85">
        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            How to start a return
          </h2>
          <p className="mt-4 text-ink/85">
            To start a return, you can contact us at{" "}
            <a href="mailto:support@humpbuck.com" className={linkContact}>
              support@humpbuck.com
            </a>{" "}
            or via{" "}
            <a
              href={WHATSAPP_URL}
              className={linkContact}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp at {WHATSAPP_DISPLAY}
            </a>
            . Please note that returns will need to be sent to the following
            address:
          </p>
          <div className="mt-5 rounded-xl border border-line bg-paper/70 px-4 py-3 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Return shipping address
            </p>
            <p className="mt-2 font-mono text-[13px] font-medium text-ink">
              [RETURN ADDRESS]
            </p>
          </div>
          <p className="mt-5 text-ink/85">
            If your return is accepted, we&apos;ll send you a return shipping
            label, as well as instructions on how and where to send your package.
            Items sent back to us without first requesting a return will not be
            accepted.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Damages and issues
          </h2>
          <p className="mt-4 text-ink/85">
            Please inspect your order upon reception and contact us immediately
            if the item is defective, damaged, or if you receive the wrong item,
            so that we can evaluate the issue and make it right.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Exceptions / non-returnable items
          </h2>
          <p className="mt-4 text-ink/85">
            Certain types of items cannot be returned, like perishable goods
            (such as food, flowers, or plants), custom products (such as special
            orders or personalized items), and personal care goods (such as
            beauty products). We also do not accept returns for hazardous
            materials, flammable liquids, or gases. Please get in touch via email
            or WhatsApp if you have questions or concerns about your specific
            item.
          </p>
          <p className="mt-4 text-ink/85">
            Unfortunately, we cannot accept returns on sale items or gift cards.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Exchanges
          </h2>
          <p className="mt-4 text-ink/85">
            The fastest way to ensure you get what you want is to return the item
            you have, and once the return is accepted, make a separate purchase
            for the new item.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            European Union 14-day cooling-off period
          </h2>
          <p className="mt-4 text-ink/85">
            Notwithstanding the above, if the merchandise is being shipped into
            the European Union, you have the right to cancel or return your order
            within 14 days, for any reason and without a justification. As
            above, your item must be in the same condition that you received it,
            unworn or unused, with tags, and in its original packaging.
            You&apos;ll also need the receipt or proof of purchase.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Refunds
          </h2>
          <p className="mt-4 text-ink/85">
            We will notify you once we&apos;ve received and inspected your
            return, and let you know if the refund was approved or not. If
            approved, you&apos;ll be automatically refunded on your original
            payment method within 10 business days. Please remember it can take
            some time for your bank or credit card company to process and post
            the refund too.
          </p>
          <p className="mt-4 text-ink/85">
            If more than 15 business days have passed since we&apos;ve approved
            your return, please contact us.
          </p>
        </section>

        <PolicyContactCard intro="For returns, refunds, or policy questions, reach out to our team:" />
      </div>

      <p className="mt-12 border-t border-line pt-8 text-sm text-muted">
        Related:{" "}
        <Link
          href="/shipping"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          Shipping & tax
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
