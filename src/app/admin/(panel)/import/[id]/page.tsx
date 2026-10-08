import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Progress } from "./progress";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function BatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: batch } = await supabaseAdmin().from("import_batches").select("id, filename").eq("id", id).maybeSingle();
  if (!batch) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Import: {batch.filename}</h1>
      <Progress batchId={batch.id} />
    </div>
  );
}
