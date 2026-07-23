import { ArrowRight, CheckCircle2, Construction, ShieldCheck } from "lucide-react";
import { V2Heading, V2StatusBadge, V2Surface, V2Text } from "@/v2/design-system";
import type { V2RuntimeRouteDescriptor } from "./route-registry";

export function V2RuntimePage({ route }: { readonly route: V2RuntimeRouteDescriptor }) {
  const Icon = route.icon;

  return (
    <section className="vdn-v2-runtime-page" aria-labelledby="vdn-v2-runtime-card-title">
      <V2Surface className="vdn-v2-runtime-page__hero" elevation="one">
        <span className="vdn-v2-runtime-page__icon" aria-hidden="true">
          <Icon />
        </span>
        <div>
          <V2StatusBadge tone="info" icon={<Construction />}>
            Em construção
          </V2StatusBadge>
          <V2Heading id="vdn-v2-runtime-card-title" level={2} size="medium">
            Uma nova experiência está sendo preparada
          </V2Heading>
          <V2Text tone="secondary">{route.description}</V2Text>
        </div>
      </V2Surface>

      <div className="vdn-v2-runtime-page__grid">
        <V2Surface className="vdn-v2-runtime-page__card">
          <ShieldCheck aria-hidden="true" />
          <V2Heading level={3} size="small">
            Integração controlada
          </V2Heading>
          <V2Text tone="secondary">
            Esta superfície usa a sessão e o router reais, sem consultar ou modificar dados.
          </V2Text>
        </V2Surface>
        <V2Surface className="vdn-v2-runtime-page__card">
          <CheckCircle2 aria-hidden="true" />
          <V2Heading level={3} size="small">
            Legado preservado
          </V2Heading>
          <V2Text tone="secondary">
            Funcionalidades atuais continuam disponíveis e não foram substituídas pela V2.
          </V2Text>
        </V2Surface>
      </div>

      <V2Surface className="vdn-v2-runtime-page__next" tone="subtle">
        <ArrowRight aria-hidden="true" />
        <V2Text>
          Próximo passo: integrar este domínio somente após contratos, testes e paridade funcional.
        </V2Text>
      </V2Surface>
    </section>
  );
}
