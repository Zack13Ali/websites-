// generateCopy with a mocked Anthropic client: retry-once behavior.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fixtureCopy } from "@/lib/ai/fixture-copy";

const parse = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { parse } };
  },
}));
vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

const { generateCopy, CopyGenerationError } = await import("@/lib/ai/generate-copy");

const input = { name: "Acme Remodeling", city: "Dallas", address: null, phone: null, hours: [], category: null };
const good = fixtureCopy(input);
const reply = (text: string, stop_reason = "end_turn") => ({ stop_reason, content: [{ type: "text", text }] });

describe("generateCopy", () => {
  beforeEach(() => parse.mockReset());

  it("returns valid copy from the first response", async () => {
    parse.mockResolvedValueOnce(reply(JSON.stringify(good)));
    await expect(generateCopy(input)).resolves.toEqual(good);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("retries once with the validation errors, then succeeds", async () => {
    const bad = { ...good, headline: "<h1>Acme</h1> remodeling" };
    parse.mockResolvedValueOnce(reply(JSON.stringify(bad))).mockResolvedValueOnce(reply(JSON.stringify(good)));
    await expect(generateCopy(input)).resolves.toEqual(good);
    expect(parse).toHaveBeenCalledTimes(2);
    const retryMessages = parse.mock.calls[1][0].messages;
    expect(retryMessages).toHaveLength(3);
    expect(retryMessages[1]).toEqual({ role: "assistant", content: JSON.stringify(bad) });
    expect(retryMessages[2].content).toContain("headline: must be plain text (no HTML tags)");
  });

  it("gives up after the second invalid response", async () => {
    parse.mockResolvedValue(reply("not json"));
    await expect(generateCopy(input)).rejects.toBeInstanceOf(CopyGenerationError);
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("treats a refusal as a failure without retrying", async () => {
    parse.mockResolvedValueOnce(reply("", "refusal"));
    await expect(generateCopy(input)).rejects.toThrow(/declined/);
    expect(parse).toHaveBeenCalledTimes(1);
  });
});
