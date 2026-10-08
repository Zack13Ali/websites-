"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { Feedback, type ActionResult } from "@/components/admin/ui";

const MAX_EDGE = 2000;

/**
 * Resizes to at most 2000px and re-encodes as JPEG in the browser, so phone
 * photos (often 5-12 MB) upload quickly, fit the server's request limit, and
 * load fast on the site. Safari also converts HEIC here.
 */
async function shrink(file: File): Promise<File> {
  if (file.size < 600_000 && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // let the server reject unsupported types
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
}

export function PhotoUploader({
  slot,
  action,
}: {
  slot: string;
  action: (prev: ActionResult, fd: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="block w-full text-xs"
        disabled={busy || pending}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          const fd = new FormData();
          fd.set("slot", slot);
          fd.set("photo", await shrink(file));
          setBusy(false);
          startTransition(() => formAction(fd));
          if (input.current) input.current.value = "";
        }}
      />
      {(busy || pending) && <p className="mt-1 text-xs text-stone-500">Uploading…</p>}
      <Feedback state={state} />
    </div>
  );
}
