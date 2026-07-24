import { createFileRoute } from "@tanstack/react-router";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy": "default-src 'none'",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function getPublicSupabaseRuntimeConfig() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  return supabaseUrl && publishableKey ? { supabaseUrl, publishableKey } : undefined;
}

export const Route = createFileRoute("/api/public/runtime-config")({
  server: {
    handlers: {
      GET: async () => {
        const config = getPublicSupabaseRuntimeConfig();
        if (!config) {
          return Response.json(
            { error: "runtime_config_unavailable" },
            { status: 503, headers: RESPONSE_HEADERS },
          );
        }

        return Response.json(config, { headers: RESPONSE_HEADERS });
      },
      POST: async () =>
        Response.json(
          { error: "method_not_allowed" },
          {
            status: 405,
            headers: { ...RESPONSE_HEADERS, Allow: "GET" },
          },
        ),
    },
  },
});
