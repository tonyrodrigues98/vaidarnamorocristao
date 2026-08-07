export interface PublicSupabaseRuntimeConfig {
  supabaseUrl: string;
  publishableKey: string;
}

let runtimeConfig: PublicSupabaseRuntimeConfig | undefined;

export function hasSupabaseRuntimeConfig(): boolean {
  if (runtimeConfig) return true;
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  return Boolean(url && key);
}

export function configureSupabaseRuntime(config: PublicSupabaseRuntimeConfig): void {
  const url = new URL(config.supabaseUrl);
  if (url.protocol !== "https:" || config.publishableKey.trim().length < 20) {
    throw new Error("Invalid public Supabase runtime configuration");
  }
  runtimeConfig = {
    supabaseUrl: url.toString().replace(/\/$/, ""),
    publishableKey: config.publishableKey.trim(),
  };
}

export function getSupabaseRuntimeConfig(): PublicSupabaseRuntimeConfig | undefined {
  return runtimeConfig;
}
