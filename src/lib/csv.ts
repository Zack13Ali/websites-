import Papa from "papaparse";
import { normalizeUsPhone } from "@/lib/phone";

export type LeadInput = { name: string; city: string; phone: string };

export type ParsedRow =
  | { rowNumber: number; ok: true; input: LeadInput }
  | { rowNumber: number; ok: false; input: Partial<LeadInput>; error: string };

export type ParseResult =
  | { ok: true; rows: ParsedRow[] }
  | { ok: false; error: string };

export const MAX_ROWS = 2000;

const HEADER_ALIASES: Record<keyof LeadInput, string[]> = {
  name: ["name", "business name", "business", "company", "company name"],
  city: ["city", "town", "location"],
  phone: ["phone", "phone number", "telephone", "tel", "mobile"],
};

function canonicalHeader(h: string): keyof LeadInput | null {
  const key = h.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  for (const [canon, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.includes(key)) return canon as keyof LeadInput;
  }
  return null;
}

/**
 * Parses a lead CSV with columns name, city, phone (header row required,
 * case-insensitive, common aliases accepted, extra columns ignored).
 * Row numbers are 1-based data rows (the header is row 0).
 */
export function parseLeadCsv(text: string): ParseResult {
  const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ""), {
    skipEmptyLines: "greedy",
  });
  const [header, ...data] = parsed.data;
  if (!header) return { ok: false, error: "The file is empty." };

  const columns = header.map(canonicalHeader);
  const idx = (k: keyof LeadInput) => columns.indexOf(k);
  const missing = (["name", "city", "phone"] as const).filter((k) => idx(k) === -1);
  if (missing.length) {
    return {
      ok: false,
      error: `Missing column(s): ${missing.join(", ")}. The first row must be a header with name, city, phone.`,
    };
  }
  if (data.length === 0) return { ok: false, error: "The file has a header but no rows." };
  if (data.length > MAX_ROWS) {
    return { ok: false, error: `Too many rows (${data.length}). The limit is ${MAX_ROWS} per file.` };
  }

  const rows: ParsedRow[] = data.map((cells, i) => {
    const get = (k: keyof LeadInput) => (cells[idx(k)] ?? "").trim().replace(/\s+/g, " ");
    const input = { name: get("name"), city: get("city"), phone: get("phone") };
    const rowNumber = i + 1;
    if (!input.name) return { rowNumber, ok: false, input, error: "Missing business name" };
    if (input.name.length > 200) return { rowNumber, ok: false, input, error: "Business name is too long" };
    if (!input.city) return { rowNumber, ok: false, input, error: "Missing city" };
    if (input.city.length > 100) return { rowNumber, ok: false, input, error: "City is too long" };
    if (input.phone && !normalizeUsPhone(input.phone)) {
      return { rowNumber, ok: false, input, error: `"${input.phone}" is not a valid US phone number` };
    }
    return { rowNumber, ok: true, input };
  });

  return { ok: true, rows };
}
