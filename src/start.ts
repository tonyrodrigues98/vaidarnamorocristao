import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { securityHeadersMiddleware } from "@/lib/securityHeaders.server";

const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType }) => handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, securityHeadersMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
