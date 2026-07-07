import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const demoEmails = [
    "james.chen.demo@humpbuck-check.local",
    "sarah.miller.demo@humpbuck-check.local",
    "refund.alert.demo@humpbuck-check.local",
    "lisa.v.demo@humpbuck-check.local",
    "dwu88.demo@humpbuck-check.local",
    "mark.s.demo@humpbuck-check.local",
    "mockup.a.demo@humpbuck-check.local",
    "mockup.b.demo@humpbuck-check.local",
    "mockup.c.demo@humpbuck-check.local",
  ];

  // Clean up previous demo rows first.
  await prisma.adminInboxMessage.deleteMany({
    where: {
      sourceEmail: { in: demoEmails },
    },
  });

  function buildOrderPayload(input: {
    email: string;
    eventType: string;
    orderId: string;
    slug: string;
    variantId: string;
    variantLabel: string;
    qty?: number;
    note: string;
  }) {
    const itemImage = "";
    const qty = input.qty ?? 1;
    return {
      email: input.email,
      eventType: input.eventType,
      orderId: input.orderId,
      itemName: input.slug,
      itemSlug: input.slug,
      itemVariantId: input.variantId,
      itemVariant: input.variantLabel,
      itemQty: qty,
      itemImage,
      itemCount: 1,
      itemsPreviewJson: JSON.stringify([
        {
          name: input.slug,
          slug: input.slug,
          variantId: input.variantId,
          variant: input.variantLabel,
          qty,
          image: itemImage,
        },
      ]),
      note: input.note,
    };
  }

  await prisma.adminInboxMessage.createMany({
    data: [
      // ORDERS
      {
        category: "order",
        status: "pending",
        sourceEmail: "james.chen.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          ...buildOrderPayload({
            email: "james.chen.demo@humpbuck-check.local",
            eventType: "paid",
            orderId: "1024",
            slug: "digitemp-2301",
            variantId: "style-01",
            variantLabel: "Black Dial / Steel Strap",
            note: "New Order #1024 | Received from James Chen, total $299.00.",
          }),
        }),
      },
      {
        category: "order",
        status: "pending",
        sourceEmail: "sarah.miller.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          ...buildOrderPayload({
            email: "sarah.miller.demo@humpbuck-check.local",
            eventType: "cancelled",
            orderId: "1021",
            slug: "rm-m08",
            variantId: "style-01",
            variantLabel: "Silver Case / Brown Strap",
            note: "Order Cancelled #1021 | Customer cancelled before shipment.",
          }),
        }),
      },
      {
        category: "order",
        status: "pending",
        sourceEmail: "refund.alert.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          ...buildOrderPayload({
            email: "refund.alert.demo@humpbuck-check.local",
            eventType: "refund_dispute",
            orderId: "1099",
            slug: "digitemp-2412m",
            variantId: "style-02",
            variantLabel: "Blue Dial",
            note: "Refund/Dispute Alert | Customer filed payment dispute.",
          }),
        }),
      },
      // SUBSCRIBE
      {
        category: "subscribe",
        status: "pending",
        sourceEmail: "lisa.v.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          email: "lisa.v.demo@humpbuck-check.local",
          eventType: "new_subscriber",
          message:
            "New Subscriber | lisa.v@gmail.com subscribed. Synced to Brevo (General List).",
        }),
      },
      {
        category: "subscribe",
        status: "pending",
        sourceEmail: "dwu88.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          email: "dwu88.demo@humpbuck-check.local",
          name: "David Wu",
          eventType: "registered_subscriber",
          message:
            "Subscriber (Registered) | David Wu (dwu88@me.com) enabled subscription preference.",
        }),
      },
      {
        category: "subscribe",
        status: "pending",
        sourceEmail: "mark.s.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          email: "mark.s.demo@humpbuck-check.local",
          eventType: "unsubscribed",
          message:
            "Unsubscribed | mark.s@outlook.com left subscription list; sending is stopped.",
        }),
      },
      // EMAIL MOCKUP REQUEST
      {
        category: "email_mockup_request",
        status: "pending",
        sourceEmail: "mockup.a.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          email: "mockup.a.demo@humpbuck-check.local",
          company: "Aster Retail",
          targetRegion: "US",
          estimatedQty: "800",
          notes: "Need logo on dial and buckle. Deadline 3 weeks.",
          message: "Email mockup request submitted by Aster Retail.",
        }),
      },
      {
        category: "email_mockup_request",
        status: "pending",
        sourceEmail: "mockup.b.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          email: "mockup.b.demo@humpbuck-check.local",
          company: "Northbay Studio",
          targetRegion: "EU",
          estimatedQty: "1200",
          notes: "Prefer silver case, dark green strap, gift box branding.",
          message: "Email mockup request submitted by Northbay Studio.",
        }),
      },
      {
        category: "email_mockup_request",
        status: "pending",
        sourceEmail: "mockup.c.demo@humpbuck-check.local",
        payloadJson: JSON.stringify({
          email: "mockup.c.demo@humpbuck-check.local",
          company: "Delta Source",
          targetRegion: "SEA",
          estimatedQty: "500",
          notes: "Need fast sampling and custom sleeve card.",
          message: "Email mockup request submitted by Delta Source.",
        }),
      },
    ],
  });

  const summary = await prisma.adminInboxMessage.groupBy({
    by: ["category"],
    where: { status: "pending" },
    _count: { _all: true },
  });
  console.log("Seeded pending messages by category:", summary);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
