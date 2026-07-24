import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, LayoutGrid, ShieldCheck } from "lucide-react";
import type { AppRole } from "@/lib/roles";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextField,
} from "@/v2/design-system";
import { adminModulesForRole, type AdminConsoleRepository, type AdminModuleId } from "./contracts";

const V2AdminModulePanel = lazy(() => import("./V2AdminModulePanel"));

export function V2AdminConsole({
  role,
  repository,
}: {
  readonly role: AppRole;
  readonly repository: AdminConsoleRepository;
}) {
  const modules = useMemo(() => adminModulesForRole(role), [role]);
  const [selectedId, setSelectedId] = useState<AdminModuleId>("overview");
  const [query, setQuery] = useState("");
  const dashboard = useQuery({
    queryKey: ["v2", "admin", "health"],
    queryFn: () => repository.loadDashboard(),
    staleTime: 15_000,
  });
  const visibleModules = modules.filter((module) =>
    `${module.label} ${module.description}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const selected = modules.find((module) => module.id === selectedId) ?? modules[0];

  if (dashboard.isPending) {
    return (
      <V2Surface className="vdn-v2-admin__state" aria-live="polite">
        <V2LoadingIndicator label="Carregando saúde operacional" />
      </V2Surface>
    );
  }
  if (dashboard.isError || !dashboard.data || !selected) {
    return (
      <V2Surface className="vdn-v2-admin__state" role="alert">
        <ShieldCheck aria-hidden="true" />
        <V2Heading level={2} size="small">
          Console indisponível ou sem permissão
        </V2Heading>
        <V2Text tone="muted">Nenhuma operação foi executada.</V2Text>
        <V2Button variant="secondary" onClick={() => void dashboard.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  return (
    <div className="vdn-v2-admin" aria-labelledby="vdn-v2-admin-title">
      <V2Surface className="vdn-v2-admin__hero" elevation="one">
        <Gauge aria-hidden="true" />
        <div>
          <V2Text variant="caption" tone="muted">
            Saúde e ação por domínio
          </V2Text>
          <V2Heading id="vdn-v2-admin-title" level={2} size="medium">
            Console administrativo
          </V2Heading>
          <V2Text tone="muted">
            Módulos pequenos sobre as autoridades existentes, sem replicar regras de negócio.
          </V2Text>
        </div>
        <V2StatusBadge tone={dashboard.data.dataFreshness === "live" ? "success" : "warning"}>
          {dashboard.data.dataFreshness}
        </V2StatusBadge>
      </V2Surface>

      <section className="vdn-v2-admin__health" aria-label="Filas que exigem ação">
        {dashboard.data.metrics.map((metric) => (
          <V2Surface key={metric.id} elevation="one">
            <V2Text variant="caption" tone="muted">
              {metric.label}
            </V2Text>
            <V2Heading level={3} size="medium">
              {metric.value}
            </V2Heading>
            <V2Button
              variant="ghost"
              size="small"
              onClick={() => setSelectedId(metric.actionModule)}
            >
              Ver fila
            </V2Button>
          </V2Surface>
        ))}
      </section>

      <div className="vdn-v2-admin__layout">
        <nav aria-label="Módulos Admin">
          <V2Surface className="vdn-v2-admin__navigation">
            <V2TextField
              label="Buscar módulo"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <div>
              {visibleModules.map((module) => (
                <V2Button
                  key={module.id}
                  variant={selected.id === module.id ? "secondary" : "ghost"}
                  aria-current={selected.id === module.id ? "page" : undefined}
                  onClick={() => setSelectedId(module.id)}
                >
                  {module.label}
                </V2Button>
              ))}
            </div>
          </V2Surface>
        </nav>

        <Suspense
          fallback={
            <V2Surface className="vdn-v2-admin__state">
              <V2LoadingIndicator label="Carregando módulo administrativo" />
            </V2Surface>
          }
        >
          <V2AdminModulePanel module={selected} />
        </Suspense>
      </div>

      <V2Surface className="vdn-v2-admin__audit-note" elevation="one">
        <Activity aria-hidden="true" />
        <V2Text>
          {dashboard.data.recentAuditCount} ações registradas nas últimas 24 horas, sem conteúdo
          privado no dashboard.
        </V2Text>
        <LayoutGrid aria-hidden="true" />
      </V2Surface>
    </div>
  );
}
