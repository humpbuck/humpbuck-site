export type ReviewSeedLocale =
  | "en"
  | "de"
  | "es"
  | "fr"
  | "it"
  | "pt"
  | "nl"
  | "ru"
  | "ja"
  | "ko"
  | "ar"
  | "he"
  | "hu";

/** All storefront locales — one review body per locale, assigned randomly per product/index. */
export const REVIEW_SEED_LOCALE_POOL: ReviewSeedLocale[] = [
  "en",
  "de",
  "es",
  "fr",
  "it",
  "pt",
  "nl",
  "ru",
  "ja",
  "ko",
  "ar",
  "he",
  "hu",
];

/** @deprecated Kept for backwards compatibility; prefer `REVIEW_SEED_LOCALE_POOL`. */
export const REVIEW_SEED_LOCALES: ReviewSeedLocale[] = [
  ...REVIEW_SEED_LOCALE_POOL,
  "en",
  "es",
  "de",
  "fr",
];

export type ReviewSeedProductContext = {
  name: string;
  movement: "mechanical" | "quartz";
  profile?: "ultra-thin" | null;
  categoryLabel?: string;
};

const FOUR_STAR_NOTES: Record<ReviewSeedLocale, string[]> = {
  en: [
    "Only minus: the strap needed one more hole for my wrist.",
    "Docking one star — a tiny mark on the crystal after week one.",
    "Great overall; clasp could click a bit more positively.",
  ],
  de: [
    "Ein Stern Abzug: das Armband hätte eine weitere Lochposition gebraucht.",
    "Sehr gut — nur die Schließe könnte etwas fester einrasten.",
    "Kleiner Kratzer auf dem Glas nach einer Woche, sonst top.",
  ],
  es: [
    "Le quito una estrella: la correa necesitaba un agujero más.",
    "Muy bueno; el cierre podría cerrar un poco más firme.",
    "Pequeña marca en el cristal tras una semana, por lo demás excelente.",
  ],
  fr: [
    "Une étoile en moins : le bracelet aurait gagné un trou de plus.",
    "Très bien ; la boucle pourrait se fermer un peu plus net.",
    "Petite trace sur le verre après une semaine, sinon parfait.",
  ],
  it: [
    "Tolgo una stella: il cinturino avrebbe bisogno di un foro in più.",
    "Ottimo; la chiusura potrebbe scattare un po' più decisa.",
    "Segnino sul vetro dopo una settimana, per il resto ottimo.",
  ],
  pt: [
    "Tiro uma estrela: a pulseira precisava de mais um furo.",
    "Muito bom; a fivela poderia fechar um pouco mais firme.",
    "Marquinha no vidro depois de uma semana, no mais excelente.",
  ],
  nl: [
    "Eén ster minder: de band had nog een gaatje nodig.",
    "Erg goed; de sluiting kon iets steviger klikken.",
    "Klein krasje op het glas na een week, verder prima.",
  ],
  ru: [
    "Снимаю звезду: ремешку не хватило одного отверстия.",
    "Отлично, но застёжка могла бы щёлкать увереннее.",
    "Мелкая отметина на стекле через неделю, в остальном супер.",
  ],
  ja: [
    "星1つ減らしました。ストラップの穴がもう1つあると完璧でした。",
    "とても良いですが、バックルのカチッと感がもう少しあると嬉しいです。",
    "1週間でガラスに小さな跡がつきました。それ以外は満足です。",
  ],
  ko: [
    "별 하나 뺐어요. 스트랩 구멍이 하나 더 있었으면 좋겠습니다.",
    "아주 좋지만 버클이 조금 더 딱 맞게 닫히면 완벽할 것 같아요.",
    "일주일 후 유리에 작은 자국이 생겼어요. 그 외에는 만족합니다.",
  ],
  ar: [
    "أنقص نجمة واحدة: السوار يحتاج ثقباً إضافياً.",
    "ممتاز لكن الإغلاق يمكن أن يكون أكثر ثباتاً.",
    "علامة صغيرة على الزجاج بعد أسبوع، وإلا فهو رائع.",
  ],
  he: [
    "מוריד כוכב אחד: לרצועה חסר חור נוסף.",
    "מצוין, אבל הנעילה יכולה להיות מעט יותר הדוקה.",
    "סימן קטן על הזכוכית אחרי שבוע, חוץ מזה מעולה.",
  ],
  hu: [
    "Egy csillag levonva: a szíjnak kellett volna még egy lyuk.",
    "Nagyon jó, de a csat egy kicsit szorosabban záródhatna.",
    "Apró jel az üvegen egy hét után, egyébként kiváló.",
  ],
};

export function seedReviewBody(
  locale: ReviewSeedLocale,
  product: ReviewSeedProductContext,
  variant: number,
  rating: 4 | 5 = 5,
): string {
  const base = reviewBody(locale, product, variant);
  if (rating === 5) return base;
  const notes = FOUR_STAR_NOTES[locale] ?? FOUR_STAR_NOTES.en;
  return `${base} ${notes[variant % notes.length]!}`;
}

function reviewBody(
  locale: ReviewSeedLocale,
  product: ReviewSeedProductContext,
  variant: number,
): string {
  const n = product.name.trim() || "this watch";
  const kind =
    product.profile === "ultra-thin"
      ? "ultra-thin"
      : product.movement === "quartz"
        ? "quartz"
        : "mechanical";

  const templates: Record<
    ReviewSeedLocale,
    Record<"mechanical" | "quartz" | "ultra-thin", string[]>
  > = {
    en: {
      mechanical: [
        `The ${n} keeps excellent time after a week on the wrist. The automatic movement feels smooth and the dial is crisp in daylight.`,
        `Beautiful finishing on ${n} — brushed case, clean indices, and the crown action is solid. Arrived well packed.`,
        `I wear ${n} daily to the office. The mechanical sweep is satisfying and the bracelet sits comfortably all day.`,
        `Gifted ${n} to my husband — he loves the weight and presence without feeling bulky. Five stars.`,
        `Hand-winding is easy and the power reserve is honest. ${n} looks even better in person than in the photos.`,
        `Second HUMPBUCK watch for me. ${n} has the same thoughtful build quality as my first order.`,
        `The lume on ${n} is readable at night and the crystal stays clean. Very happy with this purchase.`,
        `Subtle dress-watch energy. ${n} pairs with a shirt or a jacket — the case profile is refined.`,
        `Shipping was fast and the watch was running accurately out of the box. ${n} exceeded expectations.`,
        `The exhibition caseback on ${n} is a nice touch — you can see the movement working. Great value.`,
      ],
      quartz: [
        `${n} is reliably accurate — I checked it against my phone for two weeks. Clean dial and easy to read.`,
        `Quartz convenience with real wrist presence. ${n} feels substantial and the strap adjustment was simple.`,
        `Perfect everyday watch. ${n} is light, sharp-looking, and the date window is aligned nicely.`,
        `Bought ${n} for travel — set-and-forget timing and a bright display. Exactly what I wanted.`,
        `Packaging was secure and ${n} matched the listing. Battery-powered peace of mind for daily wear.`,
        `The ${n} digital readout is crisp and the buttons have a positive click. Comfortable on smaller wrists too.`,
        `My partner wears ${n} to work every day. Still looks new after a month — good materials.`,
        `Accurate, understated, and easy to live with. ${n} is a smart pick if you want low maintenance.`,
      ],
      "ultra-thin": [
        `${n} disappears under a cuff — genuinely slim and elegant. The ultra-thin profile is the main reason I bought it.`,
        `Feather-light on the wrist but still feels premium. ${n} is my go-to dress watch for events.`,
        `The thin case on ${n} is impressive in hand. Slides under shirt sleeves without catching.`,
        `Minimal dial, refined proportions. ${n} looks expensive without shouting — very pleased.`,
        `I wanted a thin mechanical for formal wear and ${n} delivered. Comfortable for long evenings.`,
        `Clasp and bracelet on ${n} are proportionate to the slim case. Arrived running well.`,
      ],
    },
    de: {
      mechanical: [
        `${n} läuft präzise und wirkt hochwertig verarbeitet. Automatikwerk angenehm ruhig am Handgelenk.`,
        `Schönes Zifferblatt und saubere Politur am Gehäuse. ${n} sieht live noch besser aus.`,
        `Trage ${n} täglich — Armband sitzt bequem, Krone lässt sich gut bedienen.`,
        `Geschenk für meinen Vater: ${n} kam sicher verpackt und pünktlich an. Sehr zufrieden.`,
        `Mechanik mit Charakter, ohne zu schwer zu wirken. ${n} ist eine klare Empfehlung.`,
      ],
      quartz: [
        `${n} hält die Zeit zuverlässig — Quarz, wie erwartet, mit schönem Design.`,
        `Leicht, gut ablesbar und robust für den Alltag. ${n} entspricht den Fotos.`,
        `Schnelle Lieferung, ${n} sofort einsatzbereit. Preis-Leistung stimmt.`,
      ],
      "ultra-thin": [
        `${n} ist wirklich flach — passt perfekt unter Hemdsäume. Elegante Uhr.`,
        `Ultradünnes Profil und feine Details. ${n} wirkt sehr edel am Handgelenk.`,
      ],
    },
    es: {
      mechanical: [
        `${n} mantiene muy buena precisión. El movimiento automático se siente suave y el dial es nítido.`,
        `Acabados cuidados y correa cómoda. ${n} luce mejor en persona que en fotos.`,
        `La uso a diario — ${n} combina con traje y casual. Envío rápido y bien protegido.`,
        `Regalo acertado: ${n} impresiona por la calidad del reloj mecánico.`,
        `La corona y el bisel están bien alineados. ${n} se siente sólido.`,
      ],
      quartz: [
        `${n} es puntual y fácil de usar. Ideal para el día a día sin complicaciones.`,
        `Diseño limpio y lectura clara. ${n} llegó exactamente como se anunciaba.`,
        `Quartz fiable con buena presencia en muñeca. Muy contento.`,
      ],
      "ultra-thin": [
        `${n} es finísimo bajo la camisa. Perfecto reloj de vestir.`,
        `Perfil ultra delgado y presencia elegante. Muy contento con ${n}.`,
      ],
    },
    fr: {
      mechanical: [
        `${n} tient parfaitement l'heure. Finition soignée et mouvement automatique agréable.`,
        `Cadran lisible, boîtier bien proportionné. ${n} est encore plus beau en vrai.`,
        `Je porte ${n} au bureau — confortable toute la journée. Livraison soignée.`,
      ],
      quartz: [
        `${n} est précis et pratique. Belle montre quartz pour un usage quotidien.`,
        `Lecture facile, style discret. ${n} correspond aux photos du site.`,
      ],
      "ultra-thin": [
        `${n} glisse sous la manchette sans accrocher. Profil ultra fin réussi.`,
        `Montre habillée légère et raffinée — ${n} fait très bonne figure.`,
      ],
    },
    it: {
      mechanical: [
        `${n} tiene l'ora con precisione. Movimento automatico fluido e quadrante pulito.`,
        `Finiture curate e cinturino comodo. ${n} supera le aspettative.`,
        `La indosso ogni giorno — ${n} ha una presenza elegante senza essere pesante.`,
      ],
      quartz: [
        `${n} è puntuale e facile da indossare. Ottima scelta al quarzo.`,
        `Design essenziale e leggibilità ottima. ${n} come da descrizione.`,
      ],
      "ultra-thin": [
        `${n} è sottilissimo sotto la camicia. Perfetto per occasioni formali.`,
        `Profilo ultra flat e linee pulite — molto soddisfatto di ${n}.`,
      ],
    },
    pt: {
      mechanical: [
        `${n} mantém a hora muito bem. Movimento automático suave e mostrador nítido.`,
        `Acabamento caprichado e pulseira confortável. ${n} chegou bem embalado.`,
        `Uso ${n} no trabalho — elegante e confortável o dia todo.`,
      ],
      quartz: [
        `${n} é preciso e prático no dia a dia. Visual limpo e moderno.`,
        `Chegou rápido e funciona perfeitamente. ${n} vale a pena.`,
      ],
      "ultra-thin": [
        `${n} é finíssimo sob a manga. Relógio social impecável.`,
        `Perfil ultra fino com presença premium — adorei ${n}.`,
      ],
    },
    nl: {
      mechanical: [
        `${n} loopt accuraat. Automatisch uurwerk voelt soepel en de wijzerplaat is scherp.`,
        `Nette afwerking en comfortabele band. ${n} ziet er live beter uit.`,
        `Draag ${n} dagelijks — mooi horloge voor kantoor en weekend.`,
      ],
      quartz: [
        `${n} is betrouwbaar en makkelijk in gebruik. Strak design.`,
        `Precies zoals afgebeeld. ${n} is een fijne dagelijkse quartz.`,
      ],
      "ultra-thin": [
        `${n} verdwijnt onder een manchet — echt dun en stijlvol.`,
        `Ultra-dun profiel met verfijnde details. Zeer tevreden.`,
      ],
    },
    ru: {
      mechanical: [
        `${n} идёт точно, автоматический механизм работает плавно. Циферблат чёткий.`,
        `Качественная обработка корпуса и удобный браслет. ${n} выглядит дороже цены.`,
        `Ношу ${n} каждый день — комфортно и стильно.`,
      ],
      quartz: [
        `${n} держит время без сюрпризов. Удобные часы на каждый день.`,
        `Аккуратная упаковка, ${n} полностью соответствует фото.`,
      ],
      "ultra-thin": [
        `${n} действительно тонкие — отлично под рубашку.`,
        `Ультратонкий профиль и аккуратный циферблат. Очень доволен.`,
      ],
    },
    ja: {
      mechanical: [
        `${n}、精度が安定していて自動巻きの感触も良いです。文字盤が実物でより綺麗でした。`,
        `仕上げが丁寧でブレスも快適。毎日付けやすい一本です。`,
        `ギフトにも最適でした — ${n}、大変喜ばれました。`,
      ],
      quartz: [
        `${n}は quartz らしい正確さで、見た目もスッキリしています。`,
        `到着が早く、写真通りの時計でした。日常使いにぴったりです。`,
      ],
      "ultra-thin": [
        `${n}は袖口の下にスッと入る薄さ。フォーマル向きに最高です。`,
        `超薄型なのに高級感があります。満足しています。`,
      ],
    },
    ko: {
      mechanical: [
        `${n} 시간 정확도 좋고 오토매틱 무브먼트 감각도 만족스러워요.`,
        `마감 깔끔하고 착용감도 편합니다. 사진보다 실물이 더 좋아요.`,
        `매일 착용 중인데 ${n} 상태 그대로예요.`,
      ],
      quartz: [
        `${n} 쿼츠답게 정확하고 데일리로 쓰기 좋습니다.`,
        `포장도 좋았고 사진과 동일합니다. 추천해요.`,
      ],
      "ultra-thin": [
        `${n} 정말 얇아서 셔츠 소매 아래도 편합니다.`,
        `울트라 슬림 실루엣이 고급스럽습니다.`,
      ],
    },
    ar: {
      mechanical: [
        `${n} دقيق جداً والحركة الأوتوماتيكية سلسة. قراءة واضحة على القرص.`,
        `تشطيب جميل وحزام مريح — ${n} أفضل من الصور.`,
        `أرتدي ${n} يومياً للعمل. تغليف ممتاز وشحن سريع.`,
      ],
      quartz: [
        `${n} موثوق وسهل الاستخدام اليومي. تصميم أنيق.`,
        `وصل بسرعة ومطابق للوصف. راضٍ عن الشراء.`,
      ],
      "ultra-thin": [
        `${n} رقيق جداً تحت أكم القميص — ساعة رسمية ممتازة.`,
        `ملف رفيع وأناقة هادئة. أنصح بها.`,
      ],
    },
    he: {
      mechanical: [
        `${n} מדויק ונעים על פרק כף היד. מנגנון אוטומטי חלק ולוח קריא.`,
        `גימור איכותי ורצועה נוחה — ${n} נראה מצוין.`,
        `חובשת את ${n} כל יום. הגיע ארוז היטב.`,
      ],
      quartz: [
        `${n} מדויק ונוח לשימוש יומיומי. עיצוב נקי.`,
        `משלוח מהיר והכל כמו בתמונות.`,
      ],
      "ultra-thin": [
        `${n} דק מאוד מתחת לשרוול — מושלם לעניבה.`,
        `פרופיל אולטרה דק ואלגנטי. מאוד מרוצה.`,
      ],
    },
    hu: {
      mechanical: [
        `${n} pontosan jár, az automata szerkezet sima. Szép számlap és kényelmes szíj.`,
        `Gondos kidolgozás — ${n} élőben még szebb.`,
        `Naponta hordom; irodai és hétköznapi viseletre is jó.`,
      ],
      quartz: [
        `${n} megbízható quartz óra, könnyű a mindennapokban.`,
        `Gyors szállítás, pontosan olyan, mint a képeken.`,
      ],
      "ultra-thin": [
        `${n} tényleg vékony ingujj alatt — elegáns dress watch.`,
        `Ultra vékony tok, finom megjelenés. Nagyon elégedett vagyok.`,
      ],
    },
  };

  const localeTemplates = templates[locale] ?? templates.en;
  const list =
    localeTemplates[kind] ??
    localeTemplates.mechanical ??
    templates.en.mechanical;
  return list[variant % list.length]!;
}
