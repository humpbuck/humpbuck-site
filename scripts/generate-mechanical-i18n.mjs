/**
 * Generate product-copy-mechanical-i18n.json and mechanical-site-i18n.json
 * Run: node scripts/generate-mechanical-i18n.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { mechProductsRest, mech9220, mech9220g, mech9236 } from "./mechanical-i18n-products-data.mjs";
import { siteI18n } from "./mechanical-i18n-site-data-part1.mjs";
import { siteI18nPart2 } from "./mechanical-i18n-site-data-part2.mjs";
import { siteI18nPart3 } from "./mechanical-i18n-site-data-part3.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

const LOCALES = ["ar", "de", "es", "fr", "he", "hu", "it", "ja", "ko", "nl", "pt", "ru"];
const MECH_SLUGS = ["6004", "9027", "9027g", "9045", "9108", "9164", "9167", "9191", "9220", "9220g", "9236", "9253"];
const DIGI_SLUGS = ["2301", "2412m"];

const mechCategoryLabel = {
  de: "Mechanisch · Herren",
  ja: "メカニカル · メンズ",
  ko: "기계식 · 남성",
  fr: "Mécanique · Homme",
  es: "Mecánico · Hombre",
  pt: "Mecânico · Homem",
  it: "Meccanico · Uomo",
  nl: "Mechanisch · Heren",
  ru: "Механика · Мужские",
  hu: "Mechanikus · Férfi",
  he: "מכני · גברים",
  ar: "ميكانيكي · رجال",
};

const quartzCategoryLabel = {
  de: "Quarz · Herren · DIGI-TEMP",
  ja: "クォーツ · メンズ · DIGI-TEMP",
  ko: "쿼츠 · 남성 · DIGI-TEMP",
  fr: "Quartz · Homme · DIGI-TEMP",
  es: "Cuarzo · Hombre · DIGI-TEMP",
  pt: "Quartz · Homem · DIGI-TEMP",
  it: "Quarzo · Uomo · DIGI-TEMP",
  nl: "Quartz · Heren · DIGI-TEMP",
  ru: "Кварцевые · Мужские · DIGI-TEMP",
  hu: "Kvarc · Férfi · DIGI-TEMP",
  he: "קוורץ · גברים · DIGI-TEMP",
  ar: "كوارتز · رجال · DIGI-TEMP",
};

const digitempCopy = {
  "2301": {
    de: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — Stahl-Ana-Digi-Uhr mit Dual-LCD, Wecker, Außentemperatur und Stoppuhr.", highlights: ["Modi TIME/DATE/ALM/OUT/STW", "Japanisches Werk, Batterie ~3 Jahre", "Edelstahlgehäuse"] },
    ja: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — デュアル LCD、アラーム、外気温、ストップウォッチ付きスチール アナデジ時計。", highlights: ["TIME/DATE/ALM/OUT/STW モード", "日本製ムーブメント、電池約 3 年", "ステンレススチールケース"] },
    ko: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — 듀얼 LCD, 알람, 외기온, 스톱워치가 있는 스틸 아나디지 시계.", highlights: ["TIME/DATE/ALM/OUT/STW 모드", "일본산 무브먼트, 배터리 약 3년", "스테인리스 스틸 케이스"] },
    fr: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — montre ana-digi en acier avec double LCD, alarme, température extérieure et chronomètre.", highlights: ["Modes TIME/DATE/ALM/OUT/STW", "Mouvement japonais, pile ~3 ans", "Boîtier en acier inoxydable"] },
    es: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — reloj ana-digi en acero con doble LCD, alarma, temperatura exterior y cronómetro.", highlights: ["Modos TIME/DATE/ALM/OUT/STW", "Movimiento japonés, batería ~3 años", "Caja de acero inoxidable"] },
    pt: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — relógio ana-digi em aço com LCD duplo, alarme, temperatura externa e cronômetro.", highlights: ["Modos TIME/DATE/ALM/OUT/STW", "Movimento japonês, bateria ~3 anos", "Caixa de aço inoxidável"] },
    it: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — orologio ana-digi in acciaio con LCD doppio, sveglia, temperatura esterna e cronometro.", highlights: ["Modalità TIME/DATE/ALM/OUT/STW", "Movimento giapponese, batteria ~3 anni", "Cassa in acciaio inossidabile"] },
    nl: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — ana-digi stalen horloge met dubbel LCD, alarm, buitentemperatuur en stopwatch.", highlights: ["Modi TIME/DATE/ALM/OUT/STW", "Japans uurwerk, batterij ~3 jaar", "Roestvrijstalen kast"] },
    ru: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — стальные ana-digi часы с двойным LCD, будильником, наружной температурой и секундомером.", highlights: ["Режимы TIME/DATE/ALM/OUT/STW", "Японский механизм, батарея ~3 года", "Корпус из нержавеющей стали"] },
    hu: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — acél ana-digi óra kettős LCD-vel, ébresztővel, külső hőmérséklettel és stopperrel.", highlights: ["TIME/DATE/ALM/OUT/STW módok", "Japán mechanizmus, ~3 év akkumulátor", "Rozsdamentes acél tok"] },
    he: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — שעון אנאלוגי-דיגיטלי מפלדה עם LCD כפול, התראה, טמפרטורה חיצונית ושעון עצר.", highlights: ["מצבי TIME/DATE/ALM/OUT/STW", "מנגנון יפני, סוללה ~3 שנים", "בית זהב מפלדת אל-חלד"] },
    ar: { shortDescription: "HUMPBUCK DIGI-TEMP 2301 — ساعة ana-digi من الفولاذ مع شاشتين LCD، منبه، درجة حرارة خارجية وكرونومتر.", highlights: ["أوضاع TIME/DATE/ALM/OUT/STW", "حركة يابانية، بطارية ~3 سنوات", "علبة من الفولاذ المقاوم للصدأ"] },
  },
  "2412m": {
    de: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — Stahl-Ana-Digi-Uhr mit Dual-LCD, Wecker, Außentemperatur und Stoppuhr.", highlights: ["Modi TIME/DATE/ALM/OUT/STW", "Japanisches Werk, Batterie ~3 Jahre", "Edelstahlgehäuse"] },
    ja: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — デュアル LCD、アラーム、外気温、ストップウォッチ付きスチール アナデジ時計。", highlights: ["TIME/DATE/ALM/OUT/STW モード", "日本製ムーブメント、電池約 3 年", "ステンレススチールケース"] },
    ko: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — 듀얼 LCD, 알람, 외기온, 스톱워치가 있는 스틸 아나디지 시계.", highlights: ["TIME/DATE/ALM/OUT/STW 모드", "일본산 무브먼트, 배터리 약 3년", "스테인리스 스틸 케이스"] },
    fr: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — montre ana-digi en acier avec double LCD, alarme, température extérieure et chronomètre.", highlights: ["Modes TIME/DATE/ALM/OUT/STW", "Mouvement japonais, pile ~3 ans", "Boîtier en acier inoxydable"] },
    es: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — reloj ana-digi en acero con doble LCD, alarma, temperatura exterior y cronómetro.", highlights: ["Modos TIME/DATE/ALM/OUT/STW", "Movimiento japonés, batería ~3 años", "Caja de acero inoxidable"] },
    pt: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — relógio ana-digi em aço com LCD duplo, alarme, temperatura externa e cronômetro.", highlights: ["Modos TIME/DATE/ALM/OUT/STW", "Movimento japonês, bateria ~3 anos", "Caixa de aço inoxidável"] },
    it: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — orologio ana-digi in acciaio con LCD doppio, sveglia, temperatura esterna e cronometro.", highlights: ["Modalità TIME/DATE/ALM/OUT/STW", "Movimento giapponese, batteria ~3 anni", "Cassa in acciaio inossidabile"] },
    nl: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — ana-digi stalen horloge met dubbel LCD, alarm, buitentemperatuur en stopwatch.", highlights: ["Modi TIME/DATE/ALM/OUT/STW", "Japans uurwerk, batterij ~3 jaar", "Roestvrijstalen kast"] },
    ru: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — стальные ana-digi часы с двойным LCD, будильником, наружной температурой и секундомером.", highlights: ["Режимы TIME/DATE/ALM/OUT/STW", "Японский механизм, батарея ~3 года", "Корпус из нержавеющей стали"] },
    hu: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — acél ana-digi óra kettős LCD-vel, ébresztővel, külső hőmérséklettel és stopperrel.", highlights: ["TIME/DATE/ALM/OUT/STW módok", "Japán mechanizmus, ~3 év akkumulátor", "Rozsdamentes acél tok"] },
    he: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — שעון אנאלוגי-דיגיטלי מפלדה עם LCD כפול, התראה, טמפרטורה חיצונית ושעון עצר.", highlights: ["מצבי TIME/DATE/ALM/OUT/STW", "מנגנון יפני, סוללה ~3 שנים", "בית זהב מפלדת אל-חלד"] },
    ar: { shortDescription: "HUMPBUCK DIGI-TEMP 2412M — ساعة ana-digi من الفولاذ مع شاشتين LCD، منبه، درجة حرارة خارجية وكرونومتر.", highlights: ["أوضاع TIME/DATE/ALM/OUT/STW", "حركة يابانية، بطارية ~3 سنوات", "علبة من الفولاذ المقاوم للصدأ"] },
  },
};

const mech6004 = {
  de: { shortDescription: "Diese Uhr vereint ein vollständig skelettiertes Automatikwerk mit einem innovativen, leichten Gehäuse aus 316L-Edelstahl und Flugzeugaluminium. Das atmungsaktive Fluorkautschukband und das ultradünne Profil (6,58 mm, 48h+ Gangreserve) verbinden markante Mechanik-Ästhetik mit leichtem Tragekomfort für jeden Anlass.", highlights: ["Skelett-Automatikwerk", "316L-Stahl & Flugzeugaluminium", "Fluorkautschuk · 48h+ Gangreserve"] },
  ja: { shortDescription: "完全スケルトンの自動巻きムーブメントを、革新的で軽量な316Lステンレススチールと航空用アルミニウムのケースに収めたモデル。通気性に優れたフッ素ゴムストラップと、6.58mmの超薄型プロファイル（48時間以上のパワーリザーブ）が、大胆なメカニカル美学と終日快適な軽さを両立します。", highlights: ["スケルトン自動巻き", "316Lスチール＆航空用アルミケース", "フッ素ゴムストラップ · 48h+パワーリザーブ"] },
  ko: { shortDescription: "혁신적이고 가벼운 316L 스테인리스 스틸과 항공용 알루미늄 케이스에 완전 스켈레톤 자동 무브먼트를 담았습니다. 통기성 좋은 플루오로러버 스트랩과 초슬림 프로필(두께 6.58mm, 48시간 이상 파워 리저브)이 대담한 메커니컬 미학과 가벼운 종일 착용감을 균형 있게 제공합니다.", highlights: ["스켈레톤 자동 무브먼트", "316L 스틸 & 항공용 알루미늄 케이스", "플루오로러버 스트랩 · 48h+ 파워 리저브"] },
  fr: { shortDescription: "Cette montre associe un mouvement automatique entièrement squeletté à un boîtier innovant et léger en acier 316L et aluminium aéronautique. Son bracelet en caoutchouc fluoré respirant et son profil ultra-fin (6,58 mm, réserve de marche 48h+) allient esthétique mécanique audacieuse et confort léger toute la journée.", highlights: ["Mouvement automatique squelette", "Boîtier 316L & aluminium aéronautique", "Bracelet fluoré · réserve 48h+"] },
  es: { shortDescription: "Este reloj combina un movimiento automático totalmente esqueletizado con una innovadora y ligera caja de acero 316L y aluminio aeronáutico. La correa de fluororubber transpirable y el perfil ultrafino (6,58 mm, reserva de 48h+) equilibran una estética mecánica audaz con comodidad ligera para todo el día.", highlights: ["Movimiento automático esqueleto", "Caja 316L y aluminio aeronáutico", "Correa fluororubber · reserva 48h+"] },
  pt: { shortDescription: "Este relógio reúne um movimento automático totalmente esqueletizado numa caixa inovadora e leve em aço 316L e alumínio aeronáutico. A pulseira de fluorborracha respirável e o perfil ultrafino (6,58 mm, reserva de 48h+) equilibram estética mecânica ousada com conforto leve para o dia inteiro.", highlights: ["Movimento automático esqueleto", "Caixa 316L e alumínio aeronáutico", "Pulseira fluorborracha · reserva 48h+"] },
  it: { shortDescription: "Questo orologio unisce un movimento automatico completamente scheletrato a una cassa innovativa e leggera in acciaio 316L e alluminio aeronautico. Il cinturino in fluororubber traspirante e il profilo ultra-sottile (6,58 mm, riserva 48h+) bilanciano estetica meccanica audace e comfort leggero per tutta la giornata.", highlights: ["Movimento automatico scheletrato", "Cassa 316L e alluminio aeronautico", "Cinturino fluororubber · riserva 48h+"] },
  nl: { shortDescription: "Dit horloge combineert een volledig geskeletteerd automatisch uurwerk met een innovatieve, lichte kast van 316L roestvrij staal en luchtvaartaluminium. De ademende fluororubber band en het ultradunne profiel (6,58 mm, 48u+ gangreserve) balanceren gedurfde mechanische esthetiek met licht draagcomfort de hele dag.", highlights: ["Geskeletteerd automatisch uurwerk", "316L staal & luchtvaartaluminium", "Fluororubber band · 48u+ reserve"] },
  ru: { shortDescription: "Часы с полностью скелетированным автоматическим механизмом в инновационном лёгком корпусе из стали 316L и авиационного алюминия. Дышащий ремешок из фтороруббера и ультратонкий профиль (6,58 мм, запас хода 48ч+) сочетают смелую механическую эстетику с лёгким комфортом на весь день.", highlights: ["Скелетированный автомат", "Корпус 316L и авиационный алюминий", "Фтороруббер · запас хода 48ч+"] },
  hu: { shortDescription: "Teljesen csontvázas automata szerkezet innovatív, könnyű 316L rozsdamentes acél és repülőgép-alumínium tokban. A légáteresztő fluoreszkáló gumi szíj és az ultra-vékony profil (6,58 mm, 48h+ tartalék) merész mechanikus esztétikát és könnyű egész napos kényelmet egyensúlyoz.", highlights: ["Csontváz automata szerkezet", "316L acél és repülőgép-alumínium", "Fluoreszkáló gumi · 48h+ tartalék"] },
  he: { shortDescription: "שעון זה משלב מנגנון אוטומטי שלד מלא בבית חדשני וקל מפלדת 316L ואלומיניום תעופתי. הרצועה מפלואורורבר הנושמת והפרופיל האולטרה-דק (6.58 מ\"מ, רזרבה 48+ שעות) מאזנים אסתטיקה מכנית נועזת עם נוחות קלה לאורך כל היום.", highlights: ["מנגנון אוטומטי שלד", "פלדת 316L ואלומיניום תעופתי", "פלואורורבר · רזרבה 48+ שעות"] },
  ar: { shortDescription: "تجمع هذه الساعة حركة أوتوماتيكية مفتوحة الهيكل بالكامل في علبة مبتكرة خفيفة من فولاذ 316L وألومنيوم طيران. مع سوار Fluororubber قابل للتنفس وملف فائق النحافة (6.58 مم، احتياطي 48+ ساعة)، توازن بين جمال ميكانيكي جريء وراحة خفيفة طوال اليوم.", highlights: ["حركة أوتوماتيكية مفتوحة الهيكل", "فولاذ 316L وألومنيوم طيران", "Fluororubber · احتياطي 48+ ساعة"] },
};

const tonneau9027 = {
  de: { shortDescription: "Mit einem einzigartigen, vollständig transparenten Tonneau-Gehäuse aus TR90-Kristall bietet diese Skelettuhr einen 360°-Panoramablick auf das rhythmische Spiel von Zahnrädern und Unruh. Das gunmetal-finierte Werk sitzt in einem schlanken Profil — 34 mm Durchmesser, nur 7,18 mm hoch — und liefert starke Optik bei ultraleichtem, hypoallergenem Tragegefühl. Über 48 Stunden Gangreserve bei 21.600 vph (3 Hz).", highlights: ["TR90 transparentes Tonneau-Gehäuse", "360°-Skelettansicht · gunmetal Werk", "34 mm · 7,18 mm dünn · 48h+"] },
  ja: { shortDescription: "TR90クリスタル製の完全透明トノーケースが、歯車とバランスホイールの精緻なリズムを360°パノラマで見せるスケルトンウォッチ。ガンメタル仕上げのムーブメントは、直径34mm・厚さわずか7.18mmのスリムプロファイルに収められ、超軽量で低アレルギーな装着感と強烈なビジュアルインパクトを両立。21,600 vph（3Hz）で48時間以上のパワーリザーブ。", highlights: ["TR90透明トノーケース", "360°スケルトン · ガンメタルムーブメント", "34mm · 7.18mm薄型 · 48h+"] },
  ko: { shortDescription: "TR90 크리스탈로 제작된 완전 투명 토노 케이스가 기어와 밸런스 휠의 정교한 리듬을 360° 파노라마로 보여 줍니다. 건메탈 마감 무브먼트는 직경 34mm, 두께 7.18mm의 슬림 프로필에 담겨 초경량·저자극 착용감과 강렬한 비주얼을 동시에 제공합니다. 21,600 vph(3Hz)에서 48시간 이상 파워 리저브.", highlights: ["TR90 투명 토노 케이스", "360° 스켈레톤 · 건메탈 무브먼트", "34mm · 7.18mm · 48h+"] },
  fr: { shortDescription: "Avec un boîtier tonneau entièrement transparent en cristal TR90, cette montre squelette offre une vue panoramique à 360° sur le rythme des engrenages et du balancier. Le mouvement fini gunmetal repose dans un profil fin — 34 mm de diamètre, 7,18 mm d'épaisseur — pour un impact visuel fort et un port ultra-léger, hypoallergénique. Plus de 48 h de réserve à 21 600 vph (3 Hz).", highlights: ["Boîtier tonneau TR90 transparent", "Vue squelette 360° · mouvement gunmetal", "34 mm · 7,18 mm · réserve 48h+"] },
  es: { shortDescription: "Con una caja tonneau totalmente transparente de cristal TR90, este reloj esqueleto ofrece una vista panorámica de 360° del ritmo de engranajes y espiral. El movimiento acabado en gunmetal se aloja en un perfil delgado — 34 mm de diámetro y solo 7,18 mm de grosor — con impacto visual potente y uso ultraligero e hipoalergénico. Más de 48 h de reserva a 21.600 vph (3 Hz).", highlights: ["Caja tonneau TR90 transparente", "Vista esqueleto 360° · movimiento gunmetal", "34 mm · 7,18 mm · reserva 48h+"] },
  pt: { shortDescription: "Com uma caixa tonneau totalmente transparente em cristal TR90, este relógio esqueleto oferece vista panorâmica de 360° do ritmo das engrenagens e do balanço. O movimento com acabamento gunmetal repousa num perfil fino — 34 mm de diâmetro e apenas 7,18 mm de espessura — com forte impacto visual e uso ultraleve e hipoalergénico. Reserva superior a 48 h a 21.600 vph (3 Hz).", highlights: ["Caixa tonneau TR90 transparente", "Vista esqueleto 360° · movimento gunmetal", "34 mm · 7,18 mm · reserva 48h+"] },
  it: { shortDescription: "Con una cassa tonneau completamente trasparente in cristallo TR90, questo orologio scheletrato offre una vista panoramica a 360° del ritmo di ingranaggi e bilanciere. Il movimento finito gunmetal è in un profilo sottile — 34 mm di diametro e soli 7,18 mm di spessore — con forte impatto visivo e portabilità ultraleggera e ipoallergenica. Oltre 48 ore di riserva a 21.600 vph (3 Hz).", highlights: ["Cassa tonneau TR90 trasparente", "Vista scheletrata 360° · movimento gunmetal", "34 mm · 7,18 mm · riserva 48h+"] },
  nl: { shortDescription: "Met een volledig transparante tonneau-kast van TR90-kristal biedt dit skelet horloge een 360° panoramisch zicht op het ritme van tandwielen en balans. Het gunmetal afgewerkte uurwerk zit in een slank profiel — 34 mm diameter, slechts 7,18 mm dik — met krachtige visuele impact en ultralicht, hypoallergeen draagcomfort. Meer dan 48 uur gangreserve bij 21.600 vph (3 Hz).", highlights: ["TR90 transparante tonneau-kast", "360° skelet · gunmetal uurwerk", "34 mm · 7,18 mm · 48u+ reserve"] },
  ru: { shortDescription: "Уникальный полностью прозрачный корпус tonneau из кристалла TR90 открывает 360° панораму шестерён и баланса. Механизм в отделке gunmetal уложен в тонкий профиль — 34 мм в диаметре и всего 7,18 мм толщиной — с мощным визуальным эффектом и ультralёгкой гипоаллергенной посадкой. Запас хода более 48 ч при 21 600 vph (3 Гц).", highlights: ["Прозрачный корпус tonneau TR90", "Скелет 360° · механизм gunmetal", "34 мм · 7,18 мм · запас 48ч+"] },
  hu: { shortDescription: "Egyedi, teljesen átlátszó TR90 kristály tonneau tokban ez a csontvázas óra 360°-os panorámát nyújt a fogaskerekek és az inga ritmusáról. A gunmetal felületű szerkezet vékony profilban — 34 mm átmérő, mindössze 7,18 mm vastagság — erős vizuális hatást és ultrakönnyű, hipoallergén viselést ad. 48 óra feletti tartalék 21 600 vph-nál (3 Hz).", highlights: ["TR90 átlátszó tonneau tok", "360° csontváz · gunmetal szerkezet", "34 mm · 7,18 mm · 48h+ tartalék"] },
  he: { shortDescription: "עם בית טונו שקוף לחלוטין מקריסטל TR90, שעון שלד זה מציע מבט פנורמי 360° על קצב הגלגלים והבаланס. המנגנון בגימור gunmetal שוכן בפרופיל רזה — 34 מ\"מ קוטר ורק 7.18 מ\"מ עובי — עם השפעה חזותית חזקה ונוחות על-קלה והיפואלרגנית. רזרבה מעל 48 שעות ב-21,600 vph (3Hz).", highlights: ["בית טונו שקוף TR90", "שלד 360° · מנגנון gunmetal", "34 מ\"מ · 7.18 מ\"מ · רזרבה 48+"] },
  ar: { shortDescription: "بعلبة tonneau شفافة بالكامل من كريستال TR90، تقدم هذه الساعة المفتوحة الهيكل رؤية بانورامية 360° لإيقاع التروس والميزان. الحركة بلمسة gunmetal في ملف نحيف — قطر 34 مم وسمك 7.18 مم فقط — مع تأثير بصري قوي وارتداء فائق الخفة ومناسب للحساسية. احتياطي يتجاوز 48 ساعة عند 21,600 vph (3Hz).", highlights: ["علبة tonneau شفافة TR90", "هيكل 360° · حركة gunmetal", "34 مم · 7.18 مم · احتياطي 48+"] },
};

const allMechCopy = {
  "6004": mech6004,
  "9027": tonneau9027,
  "9027g": tonneau9027,
  ...mechProductsRest,
  "9220": mech9220,
  "9220g": mech9220g,
  "9236": mech9236,
  "9253": mech9220,
};

const mergedSiteI18n = { ...siteI18n, ...siteI18nPart2, ...siteI18nPart3 };

function buildProductCopyJson() {
  const out = {};
  for (const locale of LOCALES) {
    out[locale] = {};
    for (const slug of MECH_SLUGS) {
      const copy = allMechCopy[slug][locale];
      out[locale][slug] = {
        categoryLabel: mechCategoryLabel[locale],
        shortDescription: copy.shortDescription,
        highlights: copy.highlights,
      };
    }
    for (const slug of DIGI_SLUGS) {
      const copy = digitempCopy[slug][locale];
      out[locale][slug] = {
        categoryLabel: quartzCategoryLabel[locale],
        shortDescription: copy.shortDescription,
        highlights: copy.highlights,
      };
    }
  }
  return out;
}

const productCopyPath = path.join(scriptsDir, "product-copy-mechanical-i18n.json");
const sitePath = path.join(scriptsDir, "mechanical-site-i18n.json");

fs.writeFileSync(productCopyPath, `${JSON.stringify(buildProductCopyJson(), null, 2)}\n`, "utf8");
fs.writeFileSync(sitePath, `${JSON.stringify(mergedSiteI18n, null, 2)}\n`, "utf8");

console.log("Wrote:", productCopyPath);
console.log("Wrote:", sitePath);
console.log(`Locales: ${LOCALES.length}`);
console.log(`Products per locale: ${MECH_SLUGS.length + DIGI_SLUGS.length} (${MECH_SLUGS.length} mechanical + ${DIGI_SLUGS.length} digitemp)`);
console.log(`Site keys per locale: ${Object.keys(mergedSiteI18n.de).length}`);
