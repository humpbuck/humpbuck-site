import Link from "next/link";
import { PolicyContactCard } from "@/components/site/PolicyContactCard";

export const metadata = {
  title: "Privacy policy",
  description:
    "How HUMPBUCK collects, uses, and discloses personal information.",
  alternates: {
    canonical: "/privacy",
  },
};

const linkContact =
  "font-medium text-blue-700 underline decoration-blue-700/30 underline-offset-[3px] transition hover:text-blue-800 hover:decoration-blue-800/50";

const LAST_UPDATED = "April 18, 2026";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="font-serif text-4xl tracking-tight text-ink">
        Privacy policy
      </h1>
      <p className="mt-3 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-[1.65] text-ink/85">
        <p>
          This Privacy Policy describes how HUMPBUCK (hereinafter referred to as
          “we” or “the Site”) collects, uses, and discloses your personal
          information when you visit, use our website (
          <a
            href="https://www.humpbuck.com"
            className={linkContact}
            target="_blank"
            rel="noopener noreferrer"
          >
            https://www.humpbuck.com
          </a>
          ), or interact with our services (collectively referred to as
          “Services”). This policy applies to all users interacting with us,
          including customers, website visitors, or any other individual whose
          information we collect under this Privacy Policy (hereinafter referred
          to as “you”).
        </p>
        <p>Please read this Privacy Policy carefully.</p>
      </div>

      <hr className="my-10 border-line" />

      <div className="space-y-12 text-sm leading-[1.65] text-ink/85">
        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Changes to this Privacy Policy
          </h2>
          <p className="mt-4 text-ink/85">
            We may update this Privacy Policy from time to time to reflect changes
            in our practices or for operational, legal, or regulatory reasons. We
            will post the revised Privacy Policy on the Site, update the “Last
            Updated” date, and take any other steps required by applicable law to
            inform you of these changes.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            How we collect and use your personal information
          </h2>
          <p className="mt-4 text-ink/85">
            To provide the Services, we collect personal information from various
            sources as outlined below. The information we collect and how we use
            it may vary depending on how you interact with us.
          </p>
          <p className="mt-4 text-ink/85">
            In addition to the specific uses listed below, we may use the
            information we collect about you to communicate with you, improve our
            Services, comply with legal obligations, enforce terms of service, and
            protect or defend our Services and rights, as well as the rights of our
            users and others.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            What personal information we collect
          </h2>
          <p className="mt-4 text-ink/85">
            The types of personal information we collect depend on how you interact
            with our Site and use our Services. The following sections describe the
            categories and specific types of personal information we collect:
          </p>

          <h3 className="mt-8 font-semibold text-ink">
            Information we collect directly from you
          </h3>
          <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-ink/40">
            <li>
              <strong>Contact information:</strong> Including your name, address,
              phone number, and email address.
            </li>
            <li>
              <strong>Order information:</strong> Including your name, billing
              address, shipping address, payment confirmation, email address, and
              phone number.
            </li>
            <li>
              <strong>Account information:</strong> Including your username,
              password, security questions, and other account security-related
              information.
            </li>
            <li>
              <strong>Customer support information:</strong> Including any
              information you provide when communicating with us, such as through
              messages sent via the Services.
            </li>
          </ul>

          <h3 className="mt-8 font-semibold text-ink">
            Information we collect about your usage
          </h3>
          <p className="mt-4 text-ink/85">
            We may automatically collect certain information about your interaction
            with the Services (“Usage Data”). To do this, we may use cookies,
            pixels, and similar technologies (“Cookies”). Usage Data may include
            device information, browser information, network connection details, IP
            addresses, and other information about your interaction with the
            Services.
          </p>

          <h3 className="mt-8 font-semibold text-ink">
            Information we obtain from third parties
          </h3>
          <p className="mt-4 text-ink/85">
            We may also obtain information about you from third parties, including
            vendors and service providers who may collect information on our
            behalf.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            How we use your personal information
          </h2>
          <ul className="mt-4 list-disc space-y-4 pl-5 text-ink/85 marker:text-ink/40">
            <li>
              <strong>Providing products and services:</strong> We use your
              personal information to provide you with the Services and to fulfill
              our contract with you, including processing payments, fulfilling
              orders, sending account-related notifications, arranging shipments,
              handling returns and exchanges, and other account-related
              functionalities.
            </li>
            <li>
              <strong>Marketing and advertising:</strong> We may use your personal
              information for marketing and promotional purposes, such as sending
              marketing communications via email, text message, or postal mail,
              and showing you advertisements for products or services.
            </li>
            <li>
              <strong>Security and fraud prevention:</strong> We use your personal
              information to detect, investigate, or take action regarding
              potential fraudulent, illegal, or malicious activities.
            </li>
            <li>
              <strong>Communicating with you and service improvement:</strong> We
              use your personal information to provide customer support and
              improve our Services.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Use of cookies
          </h2>
          <p className="mt-4 text-ink/85">
            Our website uses Cookies to improve and provide the Services. Cookies
            help us remember your actions and preferences, and enhance your user
            experience. You can choose to remove or reject Cookies through your
            browser settings, but please be aware that this may affect certain
            functions and features of the Services.
          </p>
          <p className="mt-4 text-ink/85">
            Where we use Google Analytics, we apply Google Consent Mode: analytics
            storage stays off until you accept via the on-site banner; essential
            cookies for security and checkout may still apply. You can reopen the
            banner using <strong className="font-medium text-ink">Cookie settings</strong>{" "}
            in the site footer, or clear site data for this domain in your browser.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            How we disclose personal information
          </h2>
          <p className="mt-4 text-ink/85">
            We may disclose your personal information to third parties in certain
            circumstances, such as:
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>
              To vendors or other third parties that perform services on our behalf
              (e.g., IT management, payment processing, data analytics, etc.).
            </li>
            <li>
              In response to legal obligations or to enforce service terms, protect
              our rights, or the rights of our users or others.
            </li>
            <li>
              To our affiliates or within our corporate group for business
              operations.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Third-party websites and links
          </h2>
          <p className="mt-4 text-ink/85">
            Our Site may include links to websites or other platforms operated by
            third parties. If you follow links to sites not affiliated or
            controlled by us, you should review their privacy policies and terms.
            We are not responsible for the privacy practices or security of such
            sites.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Children&apos;s data
          </h2>
          <p className="mt-4 text-ink/85">
            Our Services are not intended for children, and we do not knowingly
            collect personal information from children. If you are a parent or
            guardian of a child who has provided us with personal information,
            please contact us to request its deletion.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Security and retention of your information
          </h2>
          <p className="mt-4 text-ink/85">
            Please note that while we take reasonable security measures to protect
            your personal information, no security measure is completely
            impenetrable. We retain your personal information based on various
            factors, including the need to maintain your account, provide Services,
            comply with legal obligations, and resolve disputes.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl tracking-tight text-ink">
            Your rights
          </h2>
          <p className="mt-4 text-ink/85">
            Depending on your location, you may have some or all of the following
            rights regarding your personal information:
          </p>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-ink/85 marker:text-ink/40">
            <li>
              <strong>Right to access:</strong> You may request access to personal
              information we hold about you.
            </li>
            <li>
              <strong>Right to delete:</strong> You may request that we delete your
              personal information.
            </li>
            <li>
              <strong>Right to correct:</strong> You may request that we correct
              inaccurate personal information we hold about you.
            </li>
          </ul>
          <p className="mt-4 text-ink/85">
            Additional rights may apply under local law. To exercise these rights or
            ask questions about this policy, please use the contact information
            below.
          </p>
        </section>

        <PolicyContactCard intro="For privacy-related requests or questions about this Privacy Policy:" />
      </div>

      <p className="mt-12 border-t border-line pt-8 text-sm text-muted">
        Related:{" "}
        <Link
          href="/terms"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          Terms of service
        </Link>
        {" · "}
        <Link
          href="/shipping"
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          Shipping & tax
        </Link>
      </p>
    </div>
  );
}
