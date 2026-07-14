export const OEM_ODM_PROMO_VIDEO_URL =
  "https://assets.humpbuck.com/OEM%26ODM/HUMPBUCK%20Promotional%20Video.mp4";

export type OemOdmMoqRow = {
  type: string;
  moqPerColor: string;
  totalOrderMoq: string;
  whyChoose: string;
};

export type OemOdmServiceOption = {
  label: string;
  recommended?: boolean;
  text: string;
};

export type OemOdmContentItem = {
  label: string;
  text: string;
};

export type OemOdmContentSection = {
  heading: string;
  intro?: string;
  items: OemOdmContentItem[];
};

export const OEM_ODM_INTRO_LEAD_LINES = [
  "We are a veteran watch manufacturer with over two decades of dedicated expertise,",
  "trusted by global brands to produce over 200,000 premium watches annually. We offer OEM/ODM.",
] as const;

export const OEM_ODM_SERVICE_OPTIONS: OemOdmServiceOption[] = [
  {
    label: "ODM",
    recommended: true,
    text: "Apply your logo to our watch models (dial, crown, case back). The quality is stable, no need to remold, and the cost is relatively low.",
  },
  {
    label: "OEM",
    text: "We can make the mold based on the watch sample you provided, but the cost would be really high. We don't recommend it for our first time working together.",
  },
];

export const OEM_ODM_MOQ_ROWS: OemOdmMoqRow[] = [
  {
    type: "ODM (Custom Logo)",
    moqPerColor: "500 pcs",
    totalOrderMoq: "500 pcs",
    whyChoose: "Low starting risk, faster lead times, proven quality.",
  },
  {
    type: "OEM (Full Custom)",
    moqPerColor: "5,000 pcs",
    totalOrderMoq: "20,000 pcs",
    whyChoose: "Fully bespoke design with proprietary molds.",
  },
];

export const OEM_ODM_SECTIONS: OemOdmContentSection[] = [
  {
    heading: "Sample Policy",
    items: [
      {
        label: "Showroom samples",
        text: "We have a product sample showroom, and we usually have extra samples available that we can provide. However, if the samples are in short supply, we won't be able to offer them — please understand. You can judge the product quality by looking at the pictures or videos.",
      },
      {
        label: "Cost & Shipping",
        text: "Samples are paid prototypes, and all shipping costs are the responsibility of the buyer. Please contact our team for a custom sample quote.",
      },
    ],
  },
  {
    heading: "Customization Process",
    items: [
      {
        label: "Step 1",
        text: "Select your watch design and confirm the unit pricing.",
      },
      {
        label: "Step 2",
        text: "Provide us with your logo. We'll create mockups of the watch for you, and there will be several rounds of communication and confirmation during this process. Please note that physical samples with your logo are not included in this process, as custom mold-making for a single watch is prohibitively expensive.",
      },
      {
        label: "Step 3",
        text: "After confirming the final production plan, we'll send you an invoice, and you'll need to pay 30% of the total cost as a deposit.",
      },
      {
        label: "Step 4",
        text: "We make watches, and the production cycle usually takes 1–2 months. We'll adjust accordingly if there are holidays involved.",
      },
      {
        label: "Step 5",
        text: "Every watch undergoes strict QC. Once passed and packed, we arrange shipment to your designated location. Before shipping, you need to pay the remaining balance.",
      },
    ],
  },
  {
    heading: "Payment Terms",
    intro: "We operate on a standard 30/70 payment structure:",
    items: [
      {
        label: "30% Deposit",
        text: "Required upon signing the Proforma Invoice (PI) to initiate production.",
      },
      {
        label: "70% Balance",
        text: "Required after production is completed and the goods pass our quality inspection, prior to dispatch.",
      },
      {
        label: "Accepted Methods",
        text: "We support Bank Wire Transfer (T/T), Alipay, and other secure payment methods.",
      },
    ],
  },
  {
    heading: "Logistics & Shipping",
    intro: "We offer flexible shipping solutions to suit your needs:",
    items: [
      {
        label: "Your Shipping Agent",
        text: "If you have a shipping agent in China, we can deliver the goods directly to their warehouse.",
      },
      {
        label: "Global Shipping",
        text: "If you need direct export to your country, you can specify your carrier, or we can recommend a trusted logistics partner offering DDP (Delivered Duty Paid — Double Clearance) services. Note: All shipping costs are borne by the buyer.",
      },
    ],
  },
];
