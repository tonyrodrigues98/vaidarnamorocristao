import { ArrowLeft, ChevronRight } from "lucide-react";
import { V2Button, V2Heading, V2IconButton, V2Text } from "@/v2/design-system";
import type { V2ShellPageConfig } from "./types";

export interface V2PageHeaderProps {
  readonly page: V2ShellPageConfig;
}

export function V2PageHeader({ page }: V2PageHeaderProps) {
  const PrimaryIcon = page.primaryAction?.icon;

  return (
    <header className="vdn-v2-shell-page-header">
      {page.breadcrumbs?.length ? (
        <nav className="vdn-v2-shell-breadcrumbs" aria-label="Navegação estrutural">
          <ol>
            {page.breadcrumbs.map((breadcrumb, index) => (
              <li key={`${breadcrumb.label}-${index}`}>
                {breadcrumb.href ? (
                  <a
                    href={breadcrumb.href}
                    onClick={(event) => {
                      if (!breadcrumb.onSelect) return;
                      event.preventDefault();
                      breadcrumb.onSelect();
                    }}
                  >
                    {breadcrumb.label}
                  </a>
                ) : (
                  breadcrumb.label
                )}
                {index < page.breadcrumbs!.length - 1 ? <ChevronRight aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="vdn-v2-shell-page-header__main">
        {page.onBack ? (
          <V2IconButton
            label="Voltar"
            icon={<ArrowLeft />}
            variant="ghost"
            size="small"
            onClick={page.onBack}
          />
        ) : null}
        <div className="vdn-v2-shell-page-header__copy">
          {page.eyebrow ? (
            <V2Text variant="caption" tone="muted">
              {page.eyebrow}
            </V2Text>
          ) : null}
          <V2Heading level={1} size="large">
            {page.title}
          </V2Heading>
          {page.subtitle ? (
            <V2Text variant="body" tone="secondary">
              {page.subtitle}
            </V2Text>
          ) : null}
        </div>
        {page.primaryAction ? (
          <V2Button
            className="vdn-v2-shell-page-header__action"
            variant="primary"
            size="small"
            leadingIcon={PrimaryIcon ? <PrimaryIcon /> : undefined}
            loading={page.primaryAction.loading}
            disabled={page.primaryAction.disabled}
            onClick={page.primaryAction.onSelect}
          >
            {page.primaryAction.label}
          </V2Button>
        ) : null}
      </div>
    </header>
  );
}
