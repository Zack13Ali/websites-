import { describe, expect, it } from "vitest";
import { MAX_ROWS, parseLeadCsv } from "@/lib/csv";

describe("parseLeadCsv", () => {
  it("parses a simple file", () => {
    const r = parseLeadCsv("name,city,phone\nJJ General Contractor,Irving,(214) 555-0101\n");
    expect(r).toEqual({
      ok: true,
      rows: [
        {
          rowNumber: 1,
          ok: true,
          input: { name: "JJ General Contractor", city: "Irving", phone: "(214) 555-0101" },
        },
      ],
    });
  });

  it("accepts header aliases, any case and column order, and ignores extra columns", () => {
    const r = parseLeadCsv("Phone Number,Notes,Business Name,CITY\n214-555-0101,hot lead,Elite Remodeling,Frisco");
    expect(r.ok && r.rows[0]).toMatchObject({
      ok: true,
      input: { name: "Elite Remodeling", city: "Frisco", phone: "214-555-0101" },
    });
  });

  it("handles quoted fields with commas, CRLF and a BOM", () => {
    const r = parseLeadCsv('﻿name,city,phone\r\n"Smith, Jones & Co",Dallas,2145550101\r\n');
    expect(r.ok && r.rows[0]).toMatchObject({ ok: true, input: { name: "Smith, Jones & Co", city: "Dallas" } });
  });

  it("skips blank lines and collapses whitespace", () => {
    const r = parseLeadCsv("name,city,phone\n\n  Big   Build  ,  Plano ,\n\n");
    expect(r.ok && r.rows).toHaveLength(1);
    expect(r.ok && r.rows[0]).toMatchObject({ ok: true, input: { name: "Big Build", city: "Plano", phone: "" } });
  });

  it("allows a blank phone but rejects an invalid one", () => {
    const r = parseLeadCsv("name,city,phone\nA,Dallas,\nB,Dallas,12345\nC,Dallas,+1 (214) 555-0101");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.rows.map((x) => x.ok)).toEqual([true, false, true]);
    expect(r.rows[1]).toMatchObject({ rowNumber: 2, error: '"12345" is not a valid US phone number' });
  });

  it("reports missing name or city per row", () => {
    const r = parseLeadCsv("name,city,phone\n,Dallas,2145550101\nAcme,,2145550101");
    expect(r.ok && r.rows.map((x) => !x.ok && x.error)).toEqual(["Missing business name", "Missing city"]);
  });

  it("rejects files without the required header", () => {
    const r = parseLeadCsv("business,phone\nAcme,2145550101");
    expect(r).toEqual({ ok: false, error: expect.stringContaining("Missing column(s): city") });
  });

  it("rejects empty files and header-only files", () => {
    expect(parseLeadCsv("").ok).toBe(false);
    expect(parseLeadCsv("name,city,phone\n")).toEqual({ ok: false, error: "The file has a header but no rows." });
  });

  it("rejects files over the row limit", () => {
    const body = Array.from({ length: MAX_ROWS + 1 }, (_, i) => `Biz ${i},Dallas,`).join("\n");
    const r = parseLeadCsv(`name,city,phone\n${body}`);
    expect(r.ok).toBe(false);
  });
});
