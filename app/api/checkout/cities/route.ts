import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { City, State } from "country-state-city";

function resolveStateIso(iso2: string, stateValue: string): string | null {
  const v = stateValue.trim();
  if (!v) return null;
  const states = State.getStatesOfCountry(iso2);
  if (!states?.length) return null;
  if (iso2 === "US") {
    const u = v.toUpperCase();
    const byCode = states.find((s) => s.isoCode === u);
    if (byCode) return byCode.isoCode;
    const byName = states.find(
      (s) => s.name.toLowerCase() === v.toLowerCase(),
    );
    return byName?.isoCode ?? null;
  }
  const byName = states.find(
    (s) =>
      s.name === v ||
      s.name.toLowerCase() === v.toLowerCase(),
  );
  if (byName) return byName.isoCode;
  const byCode = states.find(
    (s) => s.isoCode.toUpperCase() === v.toUpperCase(),
  );
  return byCode?.isoCode ?? null;
}

function uniqueSortedNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const key = n.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(n.trim());
  }
  out.sort((a, b) => a.localeCompare(b, "en"));
  return out;
}

function rankByPrefixFirst(names: string[], q: string): string[] {
  const qq = q.trim().toLowerCase();
  if (!qq) return names;
  const starts = names.filter((n) => n.toLowerCase().startsWith(qq));
  const contains = names.filter(
    (n) => n.toLowerCase().includes(qq) && !n.toLowerCase().startsWith(qq),
  );
  return [...starts, ...contains];
}

/**
 * City / town options for checkout combobox (type-ahead + free text).
 * Uses country-state-city when the state value maps to a known region.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const iso2 = (sp.get("iso2") || "").toUpperCase();
  const state = sp.get("state") || "";
  const q = (sp.get("q") || "").trim().toLowerCase();

  if (!iso2) {
    return NextResponse.json({ options: [], freeText: true });
  }

  const fp = path.join(process.cwd(), "lib/data/cities", `${iso2}.json`);
  if (fs.existsSync(fp)) {
    try {
      const arr = JSON.parse(fs.readFileSync(fp, "utf8")) as unknown;
      let rows: { state?: string; name: string }[] = [];
      if (Array.isArray(arr)) {
        rows = arr
          .map((x) => {
            if (typeof x === "string") return { name: x };
            if (x && typeof x === "object" && "name" in x) {
              const o = x as { state?: string; name: string };
              return { state: o.state, name: String(o.name) };
            }
            return null;
          })
          .filter(Boolean) as { state?: string; name: string }[];
      }
      const st = state.trim();
      if (st) {
        rows = rows.filter(
          (r) => !r.state || r.state === st || r.state.toLowerCase() === st.toLowerCase(),
        );
      }
      let names = uniqueSortedNames(rows.map((r) => r.name));
      if (q) names = rankByPrefixFirst(names, q);
      const opts = names.slice(0, 400).map((n) => ({ value: n, label: n }));
      return NextResponse.json({
        options: opts,
        /** List-backed: choose a row; if empty, allow manual entry. */
        freeText: opts.length === 0,
      });
    } catch {
      return NextResponse.json({ options: [], freeText: true });
    }
  }

  const stateIso = resolveStateIso(iso2, state);
  if (!stateIso) {
    return NextResponse.json({ options: [], freeText: true });
  }

  const cities = City.getCitiesOfState(iso2, stateIso);
  if (!cities?.length) {
    return NextResponse.json({ options: [], freeText: true });
  }

  let names = uniqueSortedNames(cities.map((c) => c.name));
  if (q) names = rankByPrefixFirst(names, q);
  const opts = names.slice(0, 400).map((n) => ({ value: n, label: n }));
  return NextResponse.json({
    options: opts,
    freeText: false,
  });
}
