/**
 * Sanity-check AU postcode → lane zone 1–4 against yanwen-postcode-zones.json
 * and that effectiveZonedLaneDigit / estimateLogistics agree (postcode beats stale stored zone).
 *
 *   npx tsx scripts/verify-au-lane-zones.ts
 */
import { estimateLogistics, effectiveZonedLaneDigit } from "@/lib/logistics-estimate";
import { deriveYanwenLaneZoneDigit } from "@/lib/yanwen-postcode-zones";
import raw from "@/lib/data/yanwen-postcode-zones.json";

type Range = { lo: number; hi: number; zone: number };

const ranges = (raw as { au: { numericRanges: Range[] } }).au.numericRanges;

function firstPostcodePerCarrierZone(): Map<number, number> {
  const m = new Map<number, number>();
  for (const r of ranges) {
    if (r.zone >= 1 && r.zone <= 4 && !m.has(r.zone)) {
      m.set(r.zone, r.lo);
    }
  }
  return m;
}

function formatAuPostal(n: number): string {
  return String(n).padStart(4, "0");
}

let failed = false;

function fail(msg: string) {
  failed = true;
  console.error("FAIL:", msg);
}

const byZone = firstPostcodePerCarrierZone();
for (const z of [1, 2, 3, 4]) {
  const pcNum = byZone.get(z);
  if (pcNum == null) {
    fail(`no interval found for carrier zone ${z}`);
    continue;
  }
  const postal = formatAuPostal(pcNum);
  const d = deriveYanwenLaneZoneDigit("AU", postal);
  if (d !== String(z)) {
    fail(
      `postcode ${postal}: deriveYanwenLaneZoneDigit → ${d}, expected ${z}`,
    );
    continue;
  }
  const eff = effectiveZonedLaneDigit("AU", postal, z === 3 ? "1" : "4");
  if (eff !== String(z)) {
    fail(
      `postcode ${postal}: effectiveZonedLaneDigit(with wrong stored) → ${eff}, expected ${z}`,
    );
    continue;
  }
  const est = estimateLogistics({
    countryLabel: "Australia",
    totalUnits: 1,
    postalCode: postal,
    yanwenZone: "1",
  });
  const wantZh = `澳大利亚/${z}区`;
  if (est.cainiaoZhCountry !== wantZh) {
    fail(
      `postcode ${postal}: cainiaoZhCountry=${est.cainiaoZhCountry}, want ${wantZh}`,
    );
    continue;
  }
  console.log(`OK zone ${z}: postcode ${postal} → ${wantZh} · OH ¥${est.ohInternationalCny ?? "—"}`);
}

if (failed) {
  process.exit(1);
}
console.log("\nAll AU lane zone checks passed.");
