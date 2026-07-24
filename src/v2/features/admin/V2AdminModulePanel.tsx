import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { V2Button, V2Heading, V2StatusBadge, V2Surface, V2Text } from "@/v2/design-system";
import type { AdminModuleDescriptor } from "./contracts";

export default function V2AdminModulePanel({ module }: { readonly module: AdminModuleDescriptor }) {
  return (
    <V2Surface className="vdn-v2-admin__module-panel" elevation="one">
      <div>
        <V2StatusBadge tone={module.sensitive ? "warning" : "neutral"}>
          {module.capability}
        </V2StatusBadge>
        <V2Heading level={3} size="small">
          {module.label}
        </V2Heading>
        <V2Text tone="muted">{module.description}</V2Text>
      </div>
      {module.sensitive ? (
        <div className="vdn-v2-admin__guardrail">
          <ShieldAlert aria-hidden="true" />
          <V2Text tone="muted">
            A autorização continua no servidor. Ações exigem motivo, request ID e auditoria.
          </V2Text>
        </div>
      ) : null}
      <V2Button asChild variant="secondary">
        <a href={module.legacyDestination}>
          Abrir operação preservada
          <ArrowUpRight aria-hidden="true" />
        </a>
      </V2Button>
    </V2Surface>
  );
}
