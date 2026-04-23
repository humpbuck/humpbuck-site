import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { postcodeValidatorExistsForCountry } from "postcode-validator";
import zipcodes from "zipcodes";
import {
  getAustralianPostcodeOptions,
  narrowAustralianPostcodeOptionsForCity,
} from "@/lib/checkout-au-postcodes";
import { normalizeUsCaState } from "@/lib/checkout-zipcodes-helpers";
type ZipRow = { zip: string; city: string; state: string };

function rankByPrefixFirst(values: string[], q: string): string[] {
  const qq = q.trim().toLowerCase();
  if (!qq) return values;
  const starts = values.filter((v) => v.toLowerCase().startsWith(qq));
  const contains = values.filter(
    (v) => v.toLowerCase().includes(qq) && !v.toLowerCase().startsWith(qq),
  );
  return [...starts, ...contains];
}

/** Shown when we have no bundled list and the country may still use postal codes. */
const NO_PICKER_GENERIC =
  "There is no postal code suggestion list for this country in checkout. Type your code, then press Enter.";

/** When `postcode-validator` knows the country — usually the country does use postcodes; we just have no picker. */
const NO_PICKER_HAS_FORMAT =
  "This country uses postal codes, but checkout has no suggestion list—type yours (official format), then press Enter.";

function noPickerListHint(iso2: string): string {
  if (postcodeValidatorExistsForCountry(iso2)) return NO_PICKER_HAS_FORMAT;
  return NO_PICKER_GENERIC;
}

/**
 * Postal / ZIP options for checkout combobox.
 * AU: state = full territory name. US/CA: state = dropdown value (US code or CA full name).
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const iso2 = (sp.get("iso2") || "").toUpperCase();
  const state = sp.get("state") || "";
  const city = (sp.get("city") || "").trim();
  const q = (sp.get("q") || "").trim().toLowerCase();

  if (!iso2) {
    return NextResponse.json({
      options: [],
      freeText: true,
      hint: NO_PICKER_GENERIC,
    });
  }

  if (iso2 === "AU") {
    if (!city.trim()) {
      return NextResponse.json({
        options: [],
        freeText: true,
        hint: "Choose town/city first, then select or type your Australian postcode.",
      });
    }
    let opts = getAustralianPostcodeOptions(state);
    const { options: narrowed, note } = narrowAustralianPostcodeOptionsForCity(
      state,
      city,
      opts,
    );
    opts = narrowed;
    if (q) {
      const rankedValues = rankByPrefixFirst(
        opts.map((o) => o.value),
        q,
      );
      const byValue = new Map(opts.map((o) => [o.value, o]));
      opts = rankedValues
        .map((v) => byValue.get(v))
        .filter(Boolean) as { value: string; label: string }[];
    }
    const parts = [
      note,
      "These postcodes are filtered for your state and locality where possible—confirm against official mail.",
    ].filter(Boolean);
    const slice = opts.slice(0, 500);
    return NextResponse.json({
      options: slice,
      freeText: slice.length === 0,
      hint: parts.join(" "),
    });
  }

  if (iso2 === "GB") {
    return NextResponse.json({
      options: [],
      freeText: true,
      hint: noPickerListHint(iso2),
    });
  }

  if (iso2 === "US" || iso2 === "CA") {
    const abbr = normalizeUsCaState(iso2, state);
    if (!abbr) {
      return NextResponse.json({
        options: [],
        freeText: true,
        hint:
          iso2 === "US"
            ? "Select a state to see ZIP suggestions, or type a ZIP code and press Enter."
            : "Select a province to see postal code suggestions, or type a code and press Enter.",
      });
    }
    const stateRows = zipcodes.lookupByState(abbr) as ZipRow[];
    let rows = stateRows;
    if (!rows?.length) {
      return NextResponse.json({
        options: [],
        freeText: true,
        hint: NO_PICKER_GENERIC,
      });
    }

    const cityTrim = city.trim();
    if (!cityTrim) {
      return NextResponse.json({
        options: [],
        freeText: true,
        hint:
          iso2 === "US"
            ? "Choose town/city first to see ZIP codes for that place, or type a ZIP manually if needed."
            : "Choose town/city first to see postal codes for that place, or type a code manually if needed.",
      });
    }

    const cu = cityTrim.toUpperCase();
    rows = rows.filter((r) => (r.city || "").toUpperCase().includes(cu));

    if (!rows.length) {
      return NextResponse.json({
        options: [],
        freeText: true,
        hint:
          "No postal codes in our list match this town/city—check spelling, adjust town/city, or type your code manually.",
      });
    }
    if (q) {
      const rankedZip = rankByPrefixFirst(
        rows.map((r) => String(r.zip)),
        q,
      );
      const bucket = new Map<string, ZipRow[]>();
      for (const r of rows) {
        const z = String(r.zip);
        const list = bucket.get(z) ?? [];
        list.push(r);
        bucket.set(z, list);
      }
      rows = rankedZip
        .map((z) => {
          const list = bucket.get(z);
          return list?.shift() ?? null;
        })
        .filter(Boolean) as ZipRow[];
    }
    const options = rows.slice(0, 400).map((r) => ({
      value: String(r.zip),
      label: `${r.zip} · ${r.city}`,
    }));
    return NextResponse.json({
      options,
      freeText: false,
    });
  }

  const fp = path.join(process.cwd(), "lib/data/postcodes", `${iso2}.json`);
  if (fs.existsSync(fp)) {
    try {
      const arr = JSON.parse(fs.readFileSync(fp, "utf8")) as string[];
      let codes = Array.isArray(arr) ? arr : [];
      if (q) codes = rankByPrefixFirst(codes, q);
      return NextResponse.json({
        options: codes.slice(0, 400).map((c) => ({ value: c, label: c })),
        freeText: false,
      });
    } catch {
      return NextResponse.json({
        options: [],
        freeText: true,
        hint: noPickerListHint(iso2),
      });
    }
  }

  return NextResponse.json({
    options: [],
    freeText: true,
    hint: noPickerListHint(iso2),
  });
}
