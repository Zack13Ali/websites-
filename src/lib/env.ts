import "server-only";

// Server-side env access. Optional API keys switch their client into fixture
// mode instead of failing, so the app runs before keys are added.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}. See .env.example.`);
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabasePublishableKey() {
    return required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  },
  get supabaseSecretKey() {
    return required("SUPABASE_SECRET_KEY");
  },
  get adminEmail() {
    return required("ADMIN_EMAIL").trim().toLowerCase();
  },
  get rootDomain() {
    return process.env.ROOT_DOMAIN || "localhost:3000";
  },
  get salesPhone() {
    return process.env.SALES_PHONE || "";
  },
  get cronSecret() {
    return required("CRON_SECRET");
  },
  get anthropicApiKey() {
    return process.env.ANTHROPIC_API_KEY || "";
  },
  get anthropicModel() {
    return process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
  },
  get googlePlacesApiKey() {
    return process.env.GOOGLE_PLACES_API_KEY || "";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
};
