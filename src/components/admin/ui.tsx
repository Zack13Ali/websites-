"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

export type ActionResult = { ok: boolean; message?: string; errors?: string[] } | null;

export function SubmitButton({
  children,
  pendingText,
  className = "btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} name={name} value={value}>
      {pending ? (pendingText ?? "Working…") : children}
    </button>
  );
}

/** A form bound to a server action that returns ActionResult, with inline feedback. */
export function ActionForm({
  action,
  children,
  className,
  confirm,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <Feedback state={state} />
    </form>
  );
}

export function Feedback({ state }: { state: ActionResult }) {
  if (!state) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={`mt-3 rounded-md px-3 py-2 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
    >
      {state.message && <p>{state.message}</p>}
      {state.errors && state.errors.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {state.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn px-2 py-1 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Clipboard API blocked (http, old browser): fall back to a prompt.
          window.prompt("Copy this link:", text);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={`Copy ${text}`}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
