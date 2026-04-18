import { NextResponse } from "next/server";

const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";

export async function POST(req: Request) {
  const key = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_LIST_ID;

  if (!key?.trim() || !listIdRaw?.trim()) {
    return NextResponse.json(
      { error: "Newsletter is not configured." },
      { status: 503 },
    );
  }

  const listId = Number.parseInt(listIdRaw.trim(), 10);
  if (Number.isNaN(listId) || listId < 1) {
    return NextResponse.json(
      { error: "Invalid newsletter configuration." },
      { status: 500 },
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }

  const res = await fetch(BREVO_CONTACTS_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": key.trim(),
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
    }),
  });

  if (res.ok) {
    return NextResponse.json({ ok: true });
  }

  let detail = "";
  try {
    const errJson = (await res.json()) as { message?: string; code?: string };
    detail = errJson.message ?? JSON.stringify(errJson);
  } catch {
    detail = await res.text();
  }

  // Duplicate / already in system — treat as success for UX when update path didn’t apply
  if (res.status === 400 && /duplicate|already exists|contact already/i.test(detail)) {
    return NextResponse.json({ ok: true, already: true });
  }

  return NextResponse.json(
    { error: "Could not subscribe right now. Try again later.", detail },
    { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
  );
}
