import { NextResponse } from "next/server";

/** Profile photo uploads are disabled — names only. */
export async function POST() {
  return NextResponse.json(
    { error: "Profile photos are not supported." },
    { status: 410 },
  );
}
