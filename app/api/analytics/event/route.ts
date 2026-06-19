import { NextResponse } from "next/server";

/** Self-hosted visitor analytics disabled — use GA / Vercel Analytics instead. */
export async function POST() {
  return NextResponse.json({ ok: true, disabled: true });
}
