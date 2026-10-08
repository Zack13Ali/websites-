import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { runWorker } from "@/lib/queue";

// Queue worker. Called every minute by Supabase pg_cron (POST) or Vercel Cron
// (GET), both with "Authorization: Bearer <CRON_SECRET>".
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: NextRequest): boolean {
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.cronSecret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await runWorker({ budgetMs: 20_000 });
  return NextResponse.json(result);
}

export const GET = handle;
export const POST = handle;
