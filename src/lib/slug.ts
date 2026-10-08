// Slugs are "business-name-city", with "-2", "-3"... on a clash.

const MAX_BASE = 70;

export function slugify(...parts: string[]): string {
  const s = parts
    .join(" ")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, MAX_BASE).replace(/-+$/g, "") || "business";
}

/** Picks the first free slug given the slugs already taken that start with base. */
export function nextFreeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!used.has(candidate)) return candidate;
  }
}
