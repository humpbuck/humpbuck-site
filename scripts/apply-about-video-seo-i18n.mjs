/**
 * Sync About story + About/Video tutorial meta descriptions from the 2026-07-26 EN copy.
 * Usage: node scripts/apply-about-video-seo-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const storyParagraphs = {
  en: [
    "My fascination with ANA-DIGI watches began with a gift from my father—an ANA-DIGI TEMP watch featuring a Star Wars design.",
    "It was unlike any watch I had seen before. The combination of analog hands, a digital display, temperature functions, and a futuristic aesthetic made time feel exciting and full of imagination. It was more than a watch to me; it became a lasting memory of my father and the beginning of a lifelong fascination.",
    "Years later, that same passion inspired me to create HUMPBUCK.",
    "HUMPBUCK is dedicated to ANA-DIGI watches that bring together retro-futuristic character, practical functions, and distinctive design. We create timepieces for people who appreciate watches that feel different—watches that are not only made to tell time, but also to express personality and inspire curiosity.",
    "Just as my first ANA-DIGI watch became part of my story, I hope every HUMPBUCK watch can become part of yours.",
  ],
  de: [
    "Meine Faszination für ANA-DIGI-Uhren begann mit einem Geschenk meines Vaters — einer ANA-DIGI TEMP-Uhr mit Star-Wars-Design.",
    "Sie war anders als jede Uhr, die ich zuvor gesehen hatte. Die Kombination aus Analogzeigern, Digitalanzeige, Temperaturfunktionen und futuristischer Ästhetik ließ die Zeit spannend und voller Fantasie wirken. Für mich war sie mehr als eine Uhr; sie wurde zu einer bleibenden Erinnerung an meinen Vater und zum Beginn einer lebenslangen Faszination.",
    "Jahre später inspirierte mich dieselbe Leidenschaft dazu, HUMPBUCK zu gründen.",
    "HUMPBUCK widmet sich ANA-DIGI-Uhren, die retro-futuristischen Charakter, praktische Funktionen und unverwechselbares Design vereinen. Wir schaffen Zeitmesser für Menschen, die Uhren schätzen, die sich anders anfühlen — Uhren, die nicht nur die Zeit anzeigen, sondern Persönlichkeit ausdrücken und Neugier wecken.",
    "So wie meine erste ANA-DIGI-Uhr Teil meiner Geschichte wurde, hoffe ich, dass jede HUMPBUCK-Uhr Teil Ihrer Geschichte werden kann.",
  ],
  es: [
    "Mi fascinación por los relojes ANA-DIGI comenzó con un regalo de mi padre: un reloj ANA-DIGI TEMP con diseño de Star Wars.",
    "Era distinto a cualquier reloj que hubiera visto. La combinación de manecillas analógicas, pantalla digital, funciones de temperatura y una estética futurista hacía que el tiempo se sintiera emocionante y lleno de imaginación. Para mí era más que un reloj; se convirtió en un recuerdo duradero de mi padre y en el inicio de una fascinación de por vida.",
    "Años después, esa misma pasión me inspiró a crear HUMPBUCK.",
    "HUMPBUCK está dedicada a relojes ANA-DIGI que unen carácter retro-futurista, funciones prácticas y un diseño distintivo. Creamos relojes para quienes aprecian piezas diferentes: no solo para decir la hora, sino para expresar personalidad e inspirar curiosidad.",
    "Así como mi primer reloj ANA-DIGI pasó a formar parte de mi historia, espero que cada reloj HUMPBUCK pueda formar parte de la tuya.",
  ],
  fr: [
    "Ma fascination pour les montres ANA-DIGI a commencé par un cadeau de mon père — une montre ANA-DIGI TEMP au design Star Wars.",
    "Elle ne ressemblait à aucune montre que j’avais vue. La combinaison d’aiguilles analogiques, d’un affichage numérique, de fonctions de température et d’une esthétique futuriste rendait le temps excitant et plein d’imagination. Pour moi, c’était plus qu’une montre ; elle est devenue un souvenir durable de mon père et le début d’une fascination pour la vie.",
    "Des années plus tard, cette même passion m’a inspiré à créer HUMPBUCK.",
    "HUMPBUCK se consacre aux montres ANA-DIGI qui allient caractère rétro-futuriste, fonctions pratiques et design distinctif. Nous créons des montres pour ceux qui aiment les pièces différentes — non seulement pour dire l’heure, mais aussi pour exprimer une personnalité et inspirer la curiosité.",
    "Tout comme ma première montre ANA-DIGI est devenue une part de mon histoire, j’espère que chaque montre HUMPBUCK pourra faire partie de la vôtre.",
  ],
  it: [
    "La mia fascinazione per gli orologi ANA-DIGI è nata da un regalo di mio padre: un orologio ANA-DIGI TEMP con design Star Wars.",
    "Era diverso da qualsiasi orologio avessi visto. La combinazione di lancette analogiche, display digitale, funzioni di temperatura e un’estetica futuristica rendeva il tempo emozionante e pieno di immaginazione. Per me era più di un orologio; è diventato un ricordo duraturo di mio padre e l’inizio di una fascinazione per tutta la vita.",
    "Anni dopo, quella stessa passione mi ha ispirato a creare HUMPBUCK.",
    "HUMPBUCK è dedicata agli orologi ANA-DIGI che uniscono carattere retro-futuristico, funzioni pratiche e un design distintivo. Creiamo orologi per chi apprezza pezzi diversi — non solo per leggere l’ora, ma anche per esprimere personalità e ispirare curiosità.",
    "Proprio come il mio primo orologio ANA-DIGI è diventato parte della mia storia, spero che ogni orologio HUMPBUCK possa diventare parte della tua.",
  ],
  pt: [
    "Minha fascinação por relógios ANA-DIGI começou com um presente do meu pai — um relógio ANA-DIGI TEMP com design de Star Wars.",
    "Era diferente de qualquer relógio que eu já tinha visto. A combinação de ponteiros analógicos, display digital, funções de temperatura e uma estética futurista fazia o tempo parecer empolgante e cheio de imaginação. Para mim, era mais do que um relógio; tornou-se uma memória duradoura do meu pai e o início de uma fascinação para a vida toda.",
    "Anos depois, essa mesma paixão me inspirou a criar a HUMPBUCK.",
    "A HUMPBUCK é dedicada a relógios ANA-DIGI que unem caráter retrofuturista, funções práticas e um design distinto. Criamos relógios para quem aprecia peças diferentes — não só para marcar o tempo, mas também para expressar personalidade e inspirar curiosidade.",
    "Assim como meu primeiro relógio ANA-DIGI se tornou parte da minha história, espero que cada relógio HUMPBUCK possa se tornar parte da sua.",
  ],
  nl: [
    "Mijn fascinatie voor ANA-DIGI-horloges begon met een cadeau van mijn vader — een ANA-DIGI TEMP-horloge met Star Wars-design.",
    "Het was anders dan elk horloge dat ik eerder had gezien. De combinatie van analoge wijzers, een digitaal display, temperatuurfuncties en een futuristische uitstraling maakte tijd spannend en vol verbeelding. Voor mij was het meer dan een horloge; het werd een blijvende herinnering aan mijn vader en het begin van een levenslange fascinatie.",
    "Jaren later inspireerde diezelfde passie me om HUMPBUCK te creëren.",
    "HUMPBUCK is toegewijd aan ANA-DIGI-horloges die retro-futuristisch karakter, praktische functies en onderscheidend design samenbrengen. We maken horloges voor mensen die stukken waarderen die anders aanvoelen — niet alleen om de tijd te zien, maar ook om persoonlijkheid uit te drukken en nieuwsgierigheid te wekken.",
    "Net zoals mijn eerste ANA-DIGI-horloge deel werd van mijn verhaal, hoop ik dat elk HUMPBUCK-horloge deel van het jouwe kan worden.",
  ],
  ru: [
    "Моё увлечение часами ANA-DIGI началось с подарка отца — часов ANA-DIGI TEMP в дизайне Star Wars.",
    "Они не были похожи ни на одни часы, которые я видел раньше. Сочетание аналоговых стрелок, цифрового дисплея, функций температуры и футуристической эстетики делало время захватывающим и полным воображения. Для меня это было больше, чем часы; они стали памятью об отце и началом увлечения на всю жизнь.",
    "Годы спустя та же страсть вдохновила меня создать HUMPBUCK.",
    "HUMPBUCK посвящён часам ANA-DIGI, в которых соединяются ретрофутуристический характер, практичные функции и выразительный дизайн. Мы создаём часы для тех, кто ценит модели, которые ощущаются иначе, — не только чтобы показывать время, но и чтобы выражать характер и пробуждать любопытство.",
    "Как мои первые часы ANA-DIGI стали частью моей истории, так я надеюсь, что каждые часы HUMPBUCK смогут стать частью вашей.",
  ],
  ja: [
    "ANA-DIGI ウォッチへの私の魅了は、父からの贈り物 — Star Wars デザインの ANA-DIGI TEMP ウォッチ — から始まりました。",
    "それは、私がそれまで見たどの時計とも違っていました。アナログ針、デジタル表示、温度機能、そして未来的な美学が組み合わさり、時間はわくわくと想像に満ちたものに感じられました。私にとってそれは時計以上のものであり、父の思い出として残り、生涯続く魅了の始まりとなりました。",
    "何年も後、その同じ情熱が私に HUMPBUCK を創るきっかけを与えました。",
    "HUMPBUCK は、レトロフューチャーな個性、実用的な機能、そして個性的なデザインをひとつにする ANA-DIGI ウォッチに専念しています。私たちは、ただ時を刻むだけでなく、個性を表現し好奇心を刺激する、ちがう感触の時計を求める人のために作っています。",
    "最初の ANA-DIGI ウォッチが私の物語の一部になったように、すべての HUMPBUCK ウォッチがあなたの物語の一部になることを願っています。",
  ],
  ko: [
    "ANA-DIGI 시계에 대한 나의 매혹은 아버지의 선물 — Star Wars 디자인의 ANA-DIGI TEMP 시계 — 에서 시작되었습니다.",
    "그때까지 본 어떤 시계와도 달랐습니다. 아날로그 바늘, 디지털 디스플레이, 온도 기능, 미래적인 미학이 어우러져 시간은 설레고 상상으로 가득해 보였습니다. 나에게 그것은 시계 이상이었고, 아버지에 대한 오래 남는 추억이자 평생의 매혹의 시작이 되었습니다.",
    "수년 후, 바로 그 열정이 HUMPBUCK을 만들게 했습니다.",
    "HUMPBUCK은 레트로 퓨처리즘의 개성, 실용적인 기능, 독창적인 디자인을 하나로 모은 ANA-DIGI 시계에 전념합니다. 우리는 시간을 알려 주는 것만이 아니라 개성을 표현하고 호기심을 불러일으키는, 다르게 느껴지는 시계를 원하는 사람들을 위해 만듭니다.",
    "나의 첫 ANA-DIGI 시계가 내 이야기의 일부가 되었듯, 모든 HUMPBUCK 시계가 당신의 이야기가 되기를 바랍니다.",
  ],
  hu: [
    "Az ANA-DIGI órák iránti rajongásom apám ajándékával kezdődött — egy Star Wars dizájnú ANA-DIGI TEMP órával.",
    "Más volt, mint bármelyik óra, amit korábban láttam. Az analóg mutatók, a digitális kijelző, a hőmérséklet-funkciók és a futurisztikus esztétika együtt izgalmassá és képzelettel telivé tették az időt. Számomra több volt óránál; apám tartós emlékévé és egy élethosszig tartó rajongás kezdetévé vált.",
    "Évekkel később ugyanez a szenvedély inspirált arra, hogy létrehozzam a HUMPBUCK-ot.",
    "A HUMPBUCK olyan ANA-DIGI óráknak szenteli magát, amelyek a retro-futurisztikus karaktert, a gyakorlati funkciókat és a jellegzetes dizájnt egyesítik. Olyan órákat készítünk, amelyek másnak érződnek — nemcsak az időt mutatják, hanem személyiséget fejeznek ki és kíváncsiságot ébresztenek.",
    "Ahogy az első ANA-DIGI órám a történetem része lett, remélem, minden HUMPBUCK óra a tiedé lehet.",
  ],
  he: [
    "ההתלהבות שלי משעוני ANA-DIGI החלה במתנה מאבי — שעון ANA-DIGI TEMP בעיצוב Star Wars.",
    "הוא היה שונה מכל שעון שראיתי קודם. השילוב של מחוגים אנלוגיים, תצוגה דיגיטלית, פונקציות טמפרטורה ואסתטיקה עתידנית גרם לזמן להרגיש מרגש ומלא דמיון. עבורי זה היה יותר משעון; הוא הפך לזיכרון מתמשך של אבי ולתחילתה של התלהבות לכל החיים.",
    "שנים אחר כך, אותה תשוקה עצמה נתנה לי השראה ליצור את HUMPBUCK.",
    "HUMPBUCK מוקדשת לשעוני ANA-DIGI שמחברים אופי רטרו-עתידני, פונקציות מעשיות ועיצוב ייחודי. אנחנו יוצרים שעונים לאנשים שמעריכים חלקים שמרגישים אחרת — לא רק כדי להראות את השעה, אלא גם כדי לבטא אישיות ולעורר סקרנות.",
    "כשם ששעון ה-ANA-DIGI הראשון שלי הפך לחלק מהסיפור שלי, אני מקווה שכל שעון HUMPBUCK יוכל להפוך לחלק מהסיפור שלכם.",
  ],
  ar: [
    "بدأ افتتاني بساعات ANA-DIGI بهدية من أبي — ساعة ANA-DIGI TEMP بتصميم Star Wars.",
    "كانت مختلفة عن أي ساعة رأيتها من قبل. مزيج العقارب التناظرية والشاشة الرقمية ووظائف الحرارة والجماليات المستقبلية جعل الوقت يبدو مثيرًا ومليئًا بالخيال. كانت لي أكثر من ساعة؛ صارت ذكرى دائمة لأبي وبداية افتتان يستمر مدى الحياة.",
    "وبعد سنوات، ألهمني الشغف نفسه لإنشاء HUMPBUCK.",
    "تكرّس HUMPBUCK نفسها لساعات ANA-DIGI تجمع الطابع الريترو-المستقبلي والوظائف العملية والتصميم المميّز. نصنع ساعات لمن يقدّر القطع التي تبدو مختلفة — ليس فقط لمعرفة الوقت، بل للتعبير عن الشخصية وإلهام الفضول.",
    "وكما أصبحت ساعة ANA-DIGI الأولى جزءًا من قصتي، آمل أن تصبح كل ساعة HUMPBUCK جزءًا من قصتك.",
  ],
};

const aboutMeta = {
  en: "Learn how a childhood ANA-DIGI watch from his father inspired the creation of HUMPBUCK, a brand dedicated to distinctive retro-futuristic ANA-DIGI watches.",
  de: "Erfahren Sie, wie eine ANA-DIGI-Uhr aus der Kindheit — ein Geschenk seines Vaters — die Gründung von HUMPBUCK inspirierte, einer Marke für unverwechselbare retro-futuristische ANA-DIGI-Uhren.",
  es: "Descubre cómo un reloj ANA-DIGI de la infancia, regalo de su padre, inspiró la creación de HUMPBUCK, una marca dedicada a relojes ANA-DIGI retrofuturistas y distintivos.",
  fr: "Découvrez comment une montre ANA-DIGI d’enfance offerte par son père a inspiré la création de HUMPBUCK, une marque dédiée aux montres ANA-DIGI rétro-futuristes et distinctives.",
  it: "Scopri come un orologio ANA-DIGI dell’infanzia, regalo di suo padre, abbia ispirato la creazione di HUMPBUCK, un marchio dedicato a orologi ANA-DIGI retro-futuristici e distintivi.",
  pt: "Saiba como um relógio ANA-DIGI da infância, presente do pai, inspirou a criação da HUMPBUCK, uma marca dedicada a relógios ANA-DIGI retrofuturistas e distintos.",
  nl: "Ontdek hoe een ANA-DIGI-horloge uit zijn kindertijd — een cadeau van zijn vader — de oprichting van HUMPBUCK inspireerde, een merk voor onderscheidende retro-futuristische ANA-DIGI-horloges.",
  ru: "Узнайте, как детские часы ANA-DIGI — подарок отца — вдохновили на создание HUMPBUCK, бренда выразительных ретрофутуристических часов ANA-DIGI.",
  ja: "幼少期に父から贈られた ANA-DIGI ウォッチが、個性的なレトロフューチャー ANA-DIGI ウォッチに取り組むブランド HUMPBUCK の創造につながった物語をご紹介します。",
  ko: "어린 시절 아버지에게 받은 ANA-DIGI 시계가, 독창적인 레트로 퓨처 ANA-DIGI 시계에 전념하는 브랜드 HUMPBUCK 탄생에 어떻게 영감을 주었는지 알아보세요.",
  hu: "Ismerje meg, hogyan ihlette egy gyermekkori ANA-DIGI óra — az apja ajándéka — a HUMPBUCK létrehozását, egy jellegzetes retro-futurisztikus ANA-DIGI óráknak szentelt márkát.",
  he: "גלו כיצד שעון ANA-DIGI מהילדות, מתנה מאביו, נתן השראה ליצירת HUMPBUCK — מותג המוקדש לשעוני ANA-DIGI רטרו-עתידניים וייחודיים.",
  ar: "تعرّف كيف ألهمت ساعة ANA-DIGI من الطفولة — هدية من أبيه — إنشاء HUMPBUCK، علامة مكرّسة لساعات ANA-DIGI ريترو-مستقبلية مميّزة.",
};

const videoMeta = {
  en: "Watch the HUMPBUCK 2301 video tutorial to learn how to adjust the watch band, set the time, and use the watch correctly.",
  de: "Sehen Sie sich das Video-Tutorial zur HUMPBUCK 2301 an und lernen Sie, wie Sie das Armband anpassen, die Zeit einstellen und die Uhr richtig bedienen.",
  es: "Mira el vídeo tutorial del HUMPBUCK 2301 para aprender a ajustar la correa, poner la hora y usar el reloj correctamente.",
  fr: "Regardez le tutoriel vidéo de la HUMPBUCK 2301 pour apprendre à ajuster le bracelet, régler l’heure et utiliser la montre correctement.",
  it: "Guarda il video tutorial dell’HUMPBUCK 2301 per imparare a regolare il cinturino, impostare l’ora e usare l’orologio correttamente.",
  pt: "Assista ao vídeo tutorial do HUMPBUCK 2301 para aprender a ajustar a pulseira, acertar a hora e usar o relógio corretamente.",
  nl: "Bekijk de videotutorial van de HUMPBUCK 2301 om te leren hoe je de band afstelt, de tijd instelt en het horloge correct gebruikt.",
  ru: "Смотрите видеоурок по HUMPBUCK 2301: как подогнать ремешок, установить время и правильно пользоваться часами.",
  ja: "HUMPBUCK 2301 の動画チュートリアルで、バンドの調整・時刻合わせ・正しい使い方を学べます。",
  ko: "HUMPBUCK 2301 영상 튜토리얼에서 밴드 조절, 시간 맞추기, 올바른 사용법을 배워 보세요.",
  hu: "Nézze meg a HUMPBUCK 2301 oktatóvideóját, és tanulja meg a szíj beállítását, az idő beállítását és az óra helyes használatát.",
  he: "צפו במדריך הווידאו של HUMPBUCK 2301 כדי ללמוד איך לכוון את הרצועה, להגדיר את השעה ולהשתמש בשעון נכון.",
  ar: "شاهد فيديو شرح HUMPBUCK 2301 لتعلّم ضبط السوار وضبط الوقت واستخدام الساعة بشكل صحيح.",
};

function replaceJsonStringField(raw, parentKey, fieldKey, nextValue) {
  // Replace only the first "fieldKey": "..." string under the known parent block.
  const parentIdx = raw.indexOf(`"${parentKey}"`);
  if (parentIdx < 0) throw new Error(`Missing parent ${parentKey}`);
  const fieldToken = `"${fieldKey}"`;
  const fieldIdx = raw.indexOf(fieldToken, parentIdx);
  if (fieldIdx < 0) throw new Error(`Missing field ${parentKey}.${fieldKey}`);
  const colonIdx = raw.indexOf(":", fieldIdx + fieldToken.length);
  let i = colonIdx + 1;
  while (/\s/.test(raw[i])) i += 1;
  if (raw[i] !== '"') throw new Error(`Expected string for ${parentKey}.${fieldKey}`);
  i += 1;
  let end = i;
  let escaped = false;
  while (end < raw.length) {
    const ch = raw[end];
    if (escaped) {
      escaped = false;
    } else if (ch === "\\") {
      escaped = true;
    } else if (ch === '"') {
      break;
    }
    end += 1;
  }
  const encoded = JSON.stringify(nextValue).slice(1, -1);
  return raw.slice(0, i) + encoded + raw.slice(end);
}

const locales = Object.keys(storyParagraphs).filter((l) => l !== "en");

let updated = 0;
for (const locale of locales) {
  const file = path.join(root, "messages", `${locale}.json`);
  let raw = fs.readFileSync(file, "utf8");
  raw = replaceJsonStringField(raw, "AboutPage", "metaDescription", aboutMeta[locale]);
  raw = replaceJsonStringField(raw, "AboutPage", "storyP1", storyParagraphs[locale].join("\n\n"));
  raw = replaceJsonStringField(raw, "VideoTutorials", "metaDescription", videoMeta[locale]);
  fs.writeFileSync(file, raw, "utf8");
  // Ensure en is already correct; rewrite en via same path for consistency of newlines.
  updated += 1;
  console.log(`updated ${locale}`);
}

// Keep en in sync via the same encoder (already set manually; re-apply for safety).
{
  const file = path.join(root, "messages", "en.json");
  let raw = fs.readFileSync(file, "utf8");
  raw = replaceJsonStringField(raw, "AboutPage", "metaDescription", aboutMeta.en);
  raw = replaceJsonStringField(raw, "AboutPage", "storyP1", storyParagraphs.en.join("\n\n"));
  raw = replaceJsonStringField(raw, "VideoTutorials", "metaDescription", videoMeta.en);
  fs.writeFileSync(file, raw, "utf8");
  console.log("updated en");
  updated += 1;
}

console.log(`Done: ${updated} locale files`);
