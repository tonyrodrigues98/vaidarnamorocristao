import { ArrowRight, Bell, Check, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2IconButton,
  V2LoadingIndicator,
  V2_SEMANTIC_COLOR_NAMES,
  V2Skeleton,
  V2StatusBadge,
  V2Surface,
  V2Text,
  V2TextArea,
  V2TextField,
  V2ThemeScope,
  type V2SemanticColorName,
  type V2ThemeName,
} from "../index";
import "./showcase.css";

const colorLabels: Record<V2SemanticColorName, string> = {
  canvas: "Canvas",
  surface: "Surface",
  surfaceElevated: "Surface elevated",
  surfaceSubtle: "Surface subtle",
  surfaceInverse: "Surface inverse",
  textPrimary: "Text primary",
  textSecondary: "Text secondary",
  textMuted: "Text muted",
  textInverse: "Text inverse",
  borderDefault: "Border default",
  borderStrong: "Border strong",
  brand: "Brand",
  brandHover: "Brand hover",
  brandActive: "Brand active",
  accent: "Accent",
  success: "Success",
  warning: "Warning",
  danger: "Danger",
  info: "Info",
  focusRing: "Focus ring",
  overlay: "Overlay",
  disabled: "Disabled",
};

function ColorGrid() {
  return (
    <div className="v2-showcase__swatches" aria-label="Tokens semânticos de cor">
      {V2_SEMANTIC_COLOR_NAMES.map((name) => (
        <div className="v2-showcase__swatch" key={name}>
          <span
            className="v2-showcase__swatch-color"
            style={{
              background: `var(--v2-color-${name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)})`,
            }}
            aria-hidden="true"
          />
          <V2Text as="span" variant="caption" tone="secondary">
            {colorLabels[name]}
          </V2Text>
        </div>
      ))}
    </div>
  );
}

function ComponentGallery({ theme }: { theme: V2ThemeName }) {
  const id = (name: string) => `showcase-${theme}-${name}`;

  return (
    <div className="v2-showcase__stack">
      <section className="v2-showcase__section" aria-labelledby={id("actions")}>
        <V2Heading id={id("actions")} level={2} size="small">
          Ações e estados
        </V2Heading>
        <div className="v2-showcase__row">
          <V2Button leadingIcon={<Users />} trailingIcon={<ArrowRight />}>
            Explorar comunidade
          </V2Button>
          <V2Button variant="secondary">Participar</V2Button>
          <V2Button variant="outline">Ver detalhes</V2Button>
          <V2Button variant="ghost">Agora não</V2Button>
          <V2Button variant="destructive" leadingIcon={<Trash2 />}>
            Remover
          </V2Button>
          <V2Button variant="link">Saiba mais</V2Button>
          <V2Button loading loadingLabel="Salvando alterações">
            Salvar
          </V2Button>
          <V2Button disabled>Indisponível</V2Button>
        </div>
        <div className="v2-showcase__row" aria-label="Botões somente com ícone">
          <V2IconButton label="Ver notificações" icon={<Bell />} />
          <V2IconButton label="Criar publicação" variant="primary" icon={<Plus />} />
          <V2IconButton label="Excluir item" variant="destructive" icon={<Trash2 />} />
        </div>
      </section>

      <section className="v2-showcase__section" aria-labelledby={id("status")}>
        <V2Heading id={id("status")} level={2} size="small">
          Status e contexto
        </V2Heading>
        <div className="v2-showcase__row">
          <V2StatusBadge>Neutro</V2StatusBadge>
          <V2StatusBadge tone="brand">Comunidade</V2StatusBadge>
          <V2StatusBadge tone="success" icon={<Check />}>
            Confirmado
          </V2StatusBadge>
          <V2StatusBadge tone="warning">Atenção</V2StatusBadge>
          <V2StatusBadge tone="danger">Ação necessária</V2StatusBadge>
          <V2StatusBadge tone="info">Informação</V2StatusBadge>
        </div>
      </section>

      <section className="v2-showcase__section" aria-labelledby={id("fields")}>
        <V2Heading id={id("fields")} level={2} size="small">
          Campos
        </V2Heading>
        <div className="v2-showcase__fields">
          <V2TextField
            id={id("name")}
            label="Nome público"
            description="É assim que você aparecerá para a comunidade."
            autoComplete="name"
            placeholder="Seu nome"
            required
          />
          <V2TextField
            id={id("email")}
            label="E-mail"
            error="Revise o formato do e-mail."
            defaultValue="nome@"
            autoComplete="email"
          />
          <V2TextField
            id={id("disabled")}
            label="Identificador"
            defaultValue="@comunidade"
            disabled
          />
          <V2TextArea
            id={id("about")}
            label="Sobre você"
            description="Compartilhe algo que ajude novas conexões."
            placeholder="Escreva uma apresentação breve."
            rows={4}
          />
        </div>
      </section>

      <section className="v2-showcase__section" aria-labelledby={id("surfaces")}>
        <V2Heading id={id("surfaces")} level={2} size="small">
          Superfícies e carregamento
        </V2Heading>
        <div className="v2-showcase__surfaces">
          <V2Surface>
            <V2Heading level={3} size="small">
              Superfície base
            </V2Heading>
            <V2Text tone="secondary">
              Estrutura neutra para conteúdo futuro, sem regras de produto.
            </V2Text>
          </V2Surface>
          <V2Surface tone="elevated" elevation="two">
            <V2Heading level={3} size="small">
              Conteúdo em destaque
            </V2Heading>
            <V2Text tone="secondary">
              Elevação moderada mantém hierarquia sem sombras pesadas.
            </V2Text>
          </V2Surface>
          <V2Surface tone="inverse">
            <ShieldCheck aria-hidden="true" />
            <V2Heading level={3} size="small">
              Confiança e proteção
            </V2Heading>
            <V2Text tone="inverse">Contraste preservado em superfícies inversas.</V2Text>
          </V2Surface>
        </div>
        <V2Surface tone="subtle" className="v2-showcase__loading-card">
          <V2Skeleton width="42%" height="1rem" />
          <V2Skeleton width="100%" height="0.75rem" />
          <V2Skeleton width="78%" height="0.75rem" />
          <V2LoadingIndicator label="Carregando conteúdo" visibleLabel />
        </V2Surface>
      </section>
    </div>
  );
}

function ThemePanel({ theme }: { theme: V2ThemeName }) {
  const title = theme === "light" ? "Tema claro" : "Tema escuro";
  return (
    <V2ThemeScope theme={theme} className="v2-showcase__theme-panel">
      <header className="v2-showcase__theme-header">
        <div>
          <V2Text variant="caption" tone="muted">
            Community Platform V2
          </V2Text>
          <V2Heading level={1} size="large">
            {title}
          </V2Heading>
        </div>
        <V2StatusBadge tone="brand">{theme}</V2StatusBadge>
      </header>
      <V2Text tone="secondary" className="v2-showcase__intro">
        Uma base acolhedora, contemporânea e expressiva, com a comunidade no centro.
      </V2Text>
      <ColorGrid />
      <ComponentGallery theme={theme} />
    </V2ThemeScope>
  );
}

export function V2DesignSystemShowcase() {
  return (
    <main className="v2-showcase" data-vdn-v2-showcase="">
      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
