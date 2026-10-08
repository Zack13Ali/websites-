import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { env } from "@/lib/env";
import {
  SiteContentSchema,
  SiteContentWireSchema,
  formatIssues,
  type SiteContent,
} from "@/lib/content/schema";
import { SYSTEM_PROMPT, userPrompt, type CopyInput } from "./prompt";
import { fixtureCopy } from "./fixture-copy";

export class CopyGenerationError extends Error {}

export function copyUsesFixtures(): boolean {
  return !env.anthropicApiKey;
}

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: env.anthropicApiKey, timeout: 90_000, maxRetries: 2 });
  return client;
}

type Attempt = { raw: string; content: SiteContent | null; issues: string[] };

function check(raw: string): Attempt {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { raw, content: null, issues: ["Response was not valid JSON"] };
  }
  const result = SiteContentSchema.safeParse(json);
  return result.success
    ? { raw, content: result.data, issues: [] }
    : { raw, content: null, issues: formatIssues(result.error) };
}

async function callModel(messages: Anthropic.Beta.BetaMessageParam[]): Promise<string> {
  const response = await anthropic().beta.messages.parse({
    model: env.anthropicModel,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    output_config: { format: betaZodOutputFormat(SiteContentWireSchema), effort: "low" },
    messages,
  });
  if (response.stop_reason === "refusal") {
    throw new CopyGenerationError("The AI declined to write copy for this business");
  }
  if (response.stop_reason === "max_tokens") {
    throw new CopyGenerationError("The AI response was cut off");
  }
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text) throw new CopyGenerationError("The AI returned no text");
  return text;
}

/**
 * Generates site copy and validates it against SiteContentSchema. On a
 * validation failure, retries once, sending the errors back to the model.
 */
export async function generateCopy(input: CopyInput): Promise<SiteContent> {
  if (copyUsesFixtures()) return fixtureCopy(input);

  const first: Anthropic.Beta.BetaMessageParam = { role: "user", content: userPrompt(input) };
  const a1 = check(await callModel([first]));
  if (a1.content) return a1.content;

  const a2 = check(
    await callModel([
      first,
      { role: "assistant", content: a1.raw },
      {
        role: "user",
        content:
          "That JSON failed validation:\n" +
          a1.issues.map((i) => `- ${i}`).join("\n") +
          "\n\nReturn the complete corrected JSON.",
      },
    ]),
  );
  if (a2.content) return a2.content;

  throw new CopyGenerationError(
    `AI copy failed validation twice: ${a2.issues.slice(0, 3).join("; ")}`,
  );
}
