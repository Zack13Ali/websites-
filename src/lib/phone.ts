// US phone helpers.

/** 10 digits, or null if it isn't a plausible US number. */
export function normalizeUsPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.length === 10 ? digits : null;
}

export function formatUsPhone(raw: string | null | undefined): string {
  const d = normalizeUsPhone(raw);
  return d ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : (raw ?? "").trim();
}

/** tel: href value, e.g. "+15550104477". */
export function telHref(raw: string | null | undefined): string | null {
  const d = normalizeUsPhone(raw);
  return d ? `tel:+1${d}` : null;
}
