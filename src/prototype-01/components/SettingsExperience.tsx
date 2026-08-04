"use client";

import {
  Accessibility,
  ArrowLeft,
  Bell,
  Captions,
  Check,
  ChevronRight,
  CircleAlert,
  Contrast,
  Eye,
  HardDrive,
  HeartHandshake,
  HelpCircle,
  Info,
  LockKeyhole,
  MessageCircle,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Type,
  UserRound,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useState } from "react";
import "../styles/SettingsExperience.css";

type SettingSection =
  | "Conta"
  | "Perfil"
  | "Privacidade"
  | "Conversas"
  | "Comunidade"
  | "Modo Namoro"
  | "Notificações"
  | "Aparência e acessibilidade"
  | "Armazenamento e dados"
  | "PWA e dispositivo"
  | "Ajuda"
  | "Sobre";

type SettingsState =
  | "normal"
  | "loading"
  | "offline"
  | "error"
  | "permission"
  | "expired"
  | "paused"
  | "deletion";

const sections: Array<{
  title: SettingSection;
  description: string;
  icon: typeof UserRound;
  keywords: string;
}> = [
  {
    title: "Conta",
    description: "Login, sessões, dados e encerramento",
    icon: UserRound,
    keywords: "nome username email senha google recuperação exportar excluir",
  },
  {
    title: "Perfil",
    description: "Identidade, caminhada e personalização",
    icon: Palette,
    keywords: "foto apresentação galeria módulos visitantes url",
  },
  {
    title: "Privacidade",
    description: "Quem encontra, vê e interage",
    icon: ShieldCheck,
    keywords: "descoberta perfil amigos publicações momentos visitas bloqueados",
  },
  {
    title: "Conversas",
    description: "Presença, mídia e solicitações",
    icon: MessageCircle,
    keywords: "leitura digitando download áudio restritos bloqueados",
  },
  {
    title: "Comunidade",
    description: "Audiência, menções e eventos",
    icon: UsersRound,
    keywords: "momentos comentários convites sensível atividade salvos",
  },
  {
    title: "Modo Namoro",
    description: "Ativação, preferências e privacidade",
    icon: HeartHandshake,
    keywords: "romântico recados pausar desativar requisitos",
  },
  {
    title: "Notificações",
    description: "Push, som e horários silenciosos",
    icon: Bell,
    keywords: "email vibração cinema pets arcade loja verbo segurança",
  },
  {
    title: "Aparência e acessibilidade",
    description: "Tema, texto, contraste e movimento",
    icon: Accessibility,
    keywords: "claro escuro sistema transparência autoplay legendas idioma",
  },
  {
    title: "Armazenamento e dados",
    description: "Cache, downloads e qualidade",
    icon: HardDrive,
    keywords: "imagens vídeos áudio cinema verbo wifi upload",
  },
  {
    title: "PWA e dispositivo",
    description: "Instalação, permissões e bloqueio local",
    icon: Smartphone,
    keywords: "biometria câmera microfone fotos localização sessão aplicativo",
  },
  {
    title: "Ajuda",
    description: "Suporte, segurança e denúncias",
    icon: HelpCircle,
    keywords: "problema abuso recuperar conta regras contato",
  },
  {
    title: "Sobre",
    description: "Termos, privacidade e versão",
    icon: Info,
    keywords: "termos política versão aplicativo",
  },
];

class SettingsBoundary extends Component<
  { children: React.ReactNode; onClose: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="settings-local-error" role="alert">
          <CircleAlert size={30} />
          <h2>Configurações encontrou um problema</h2>
          <p>
            O erro ficou contido nesta área. As cinco abas e os outros módulos continuam
            funcionando.
          </p>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw size={17} /> Tentar novamente
          </button>
          <button className="secondary" onClick={this.props.onClose}>
            Voltar ao aplicativo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function SettingRow({
  title,
  description,
  value,
  checked,
  onClick,
  danger = false,
}: {
  title: string;
  description?: string;
  value?: string;
  checked?: boolean;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button className={`setting-option ${danger ? "danger" : ""}`} onClick={onClick}>
      <span>
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      {typeof checked === "boolean" ? (
        <i className={`settings-switch ${checked ? "on" : ""}`}>
          <b />
        </i>
      ) : (
        <>
          {value && <em>{value}</em>}
          <ChevronRight size={17} />
        </>
      )}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="settings-group">
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
}

type ThemeMode = "system" | "light" | "dark";
type TextSize = "small" | "standard" | "large" | "xlarge";
type HapticMode = "enabled" | "reduced" | "disabled";

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; icon?: typeof Sun }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="appearance-segments">
      <legend>{label}</legend>
      <div>
        {options.map(({ value: option, label: optionLabel, icon: Icon }) => (
          <button
            key={option}
            type="button"
            className={value === option ? "selected" : ""}
            aria-pressed={value === option}
            onClick={() => onChange(option)}
          >
            {Icon && <Icon size={17} />}
            <span>{optionLabel}</span>
            {value === option && <Check size={15} />}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function AppearanceContent({
  showToast,
  theme,
  updateTheme,
}: {
  showToast: (message: string) => void;
  theme: ThemeMode;
  updateTheme: (next: ThemeMode) => void;
}) {
  const [textSize, setTextSize] = useState<TextSize>("standard");
  const [contrast, setContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [captionSize, setCaptionSize] = useState("Padrão");
  const [captionBackground, setCaptionBackground] = useState("Semitransparente");
  const [captionLanguage, setCaptionLanguage] = useState("Português (Brasil)");
  const [haptics, setHaptics] = useState<HapticMode>("enabled");

  const applyPreferences = (next: Record<string, string | boolean>) => {
    Object.entries(next).forEach(([key, value]) => window.localStorage.setItem(key, String(value)));
    window.dispatchEvent(new CustomEvent("vdn-appearance-change"));
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTextSize((window.localStorage.getItem("vdn-text-size") as TextSize | null) ?? "standard");
      setContrast(window.localStorage.getItem("vdn-high-contrast") === "true");
      setReduceMotion(window.localStorage.getItem("vdn-reduce-motion") === "true");
      setReduceTransparency(window.localStorage.getItem("vdn-reduce-transparency") === "true");
      setDataSaver(window.localStorage.getItem("vdn-data-saver") === "true");
      setCaptions(window.localStorage.getItem("vdn-captions") !== "false");
      setCaptionSize(window.localStorage.getItem("vdn-caption-size") ?? "Padrão");
      setCaptionBackground(
        window.localStorage.getItem("vdn-caption-background") ?? "Semitransparente",
      );
      setCaptionLanguage(
        window.localStorage.getItem("vdn-caption-language") ?? "Português (Brasil)",
      );
      setHaptics(
        (window.localStorage.getItem("vdn-haptics-mode") as HapticMode | null) ?? "enabled",
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const updateText = (next: TextSize) => {
    setTextSize(next);
    applyPreferences({ "vdn-text-size": next });
    showToast("Tamanho do texto atualizado");
  };
  const togglePreference = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    current: boolean,
    key: string,
    enabledMessage: string,
  ) => {
    const next = !current;
    setter(next);
    applyPreferences({ [key]: next });
    showToast(next ? enabledMessage : "Preferência desativada");
  };

  return (
    <>
      <div className="appearance-preview" aria-live="polite">
        <div className="appearance-preview-device">
          <header>
            <span />
            <span />
            <span />
          </header>
          <article>
            <i />
            <div>
              <strong>Comunidade em destaque</strong>
              <span>O preview acompanha suas escolhas sem recarregar.</span>
            </div>
          </article>
          <footer>
            <span />
            <b />
            <span />
          </footer>
        </div>
        <div>
          <span className="section-overline">PREVIEW IMEDIATO</span>
          <strong>
            {theme === "system"
              ? "Seguindo este dispositivo"
              : theme === "light"
                ? "Tema claro"
                : "Tema escuro"}
          </strong>
          <small>iPhone · Android · tablet · desktop · PWA · navegador</small>
        </div>
      </div>

      <Group title="Tema">
        <SegmentedControl
          label="Escolha do tema"
          value={theme}
          options={[
            { value: "system", label: "Sistema", icon: Monitor },
            { value: "light", label: "Claro", icon: Sun },
            { value: "dark", label: "Escuro", icon: Moon },
          ]}
          onChange={updateTheme}
        />
      </Group>

      <Group title="Leitura">
        <div className="appearance-control-card">
          <div className="appearance-control-title">
            <Type size={18} />
            <span>
              <strong>Tamanho do texto</strong>
              <small>Botões, cards e tabs se adaptam ao conteúdo.</small>
            </span>
          </div>
          <SegmentedControl
            label="Tamanho do texto"
            value={textSize}
            options={[
              { value: "small", label: "Pequeno" },
              { value: "standard", label: "Padrão" },
              { value: "large", label: "Grande" },
              { value: "xlarge", label: "Muito grande" },
            ]}
            onChange={updateText}
          />
        </div>
        <SettingRow
          title="Contraste elevado"
          description="Reforça bordas, texto secundário, foco e seleção"
          checked={contrast}
          onClick={() =>
            togglePreference(
              setContrast,
              contrast,
              "vdn-high-contrast",
              "Contraste elevado ativado",
            )
          }
        />
      </Group>

      <Group title="Movimento e superfícies">
        <SettingRow
          title="Reduzir movimento"
          description="Troca deslocamentos por transições curtas e simplifica efeitos"
          checked={reduceMotion}
          onClick={() =>
            togglePreference(
              setReduceMotion,
              reduceMotion,
              "vdn-reduce-motion",
              "Movimento reduzido",
            )
          }
        />
        <SettingRow
          title="Reduzir transparência"
          description="Substitui blur e vidro por superfícies opacas"
          checked={reduceTransparency}
          onClick={() =>
            togglePreference(
              setReduceTransparency,
              reduceTransparency,
              "vdn-reduce-transparency",
              "Transparência reduzida",
            )
          }
        />
      </Group>

      <Group title="Mídia e dados">
        <SettingRow
          title="Economia de dados"
          description="Autoplay sob toque, imagens menores e downloads manuais"
          checked={dataSaver}
          onClick={() =>
            togglePreference(setDataSaver, dataSaver, "vdn-data-saver", "Economia de dados ativada")
          }
        />
        <SettingRow
          title="Sempre mostrar legendas"
          description="Quando a mídia disponibilizar legendas"
          checked={captions}
          onClick={() =>
            togglePreference(setCaptions, captions, "vdn-captions", "Legendas ativadas")
          }
        />
        <div className="appearance-select-grid">
          <label>
            Tamanho
            <select
              value={captionSize}
              onChange={(event) => {
                setCaptionSize(event.target.value);
                applyPreferences({ "vdn-caption-size": event.target.value });
              }}
            >
              <option>Pequeno</option>
              <option>Padrão</option>
              <option>Grande</option>
            </select>
          </label>
          <label>
            Fundo
            <select
              value={captionBackground}
              onChange={(event) => {
                setCaptionBackground(event.target.value);
                applyPreferences({ "vdn-caption-background": event.target.value });
              }}
            >
              <option>Semitransparente</option>
              <option>Opaco</option>
              <option>Alto contraste</option>
            </select>
          </label>
          <label>
            Idioma
            <select
              value={captionLanguage}
              onChange={(event) => {
                setCaptionLanguage(event.target.value);
                applyPreferences({ "vdn-caption-language": event.target.value });
              }}
            >
              <option>Português (Brasil)</option>
              <option>Original</option>
              <option>Inglês</option>
            </select>
          </label>
          <div>
            <Captions size={18} />
            <span>
              <strong>Descrição de áudio</strong>
              <small>Preparado para disponibilidade futura.</small>
            </span>
          </div>
        </div>
      </Group>

      <Group title="Feedback">
        <SegmentedControl
          label="Feedback tátil"
          value={haptics}
          options={[
            { value: "enabled", label: "Ativado" },
            { value: "reduced", label: "Reduzido" },
            { value: "disabled", label: "Desativado" },
          ]}
          onChange={(next) => {
            setHaptics(next);
            applyPreferences({
              "vdn-haptics-mode": next,
              "vdn-haptics": next === "disabled" ? "false" : "true",
            });
            showToast("Feedback tátil salvo visualmente");
          }}
        />
      </Group>

      <div className="settings-note">
        <Contrast size={18} />
        <span>
          As preferências são demonstrativas e permanecem neste dispositivo. Rota, scroll, filtros e
          área aberta não são reiniciados.
        </span>
      </div>
    </>
  );
}

function AccountContent({
  showToast,
  openSessions,
  openDanger,
}: {
  showToast: (message: string) => void;
  openSessions: () => void;
  openDanger: (mode: "deactivate" | "delete") => void;
}) {
  return (
    <>
      <Group title="Identidade e acesso">
        <SettingRow
          title="Nome"
          value="Antonio Rodrigues"
          onClick={() => showToast("Editor de nome aberto")}
        />
        <SettingRow
          title="Username"
          value="@antoniorodrigues"
          onClick={() => showToast("Editor de username aberto")}
        />
        <SettingRow
          title="E-mail"
          value="a••••••@gmail.com"
          onClick={() => showToast("Confirmação de e-mail aberta")}
        />
        <SettingRow
          title="Senha"
          description="Alterada há 41 dias"
          onClick={() => showToast("Fluxo de senha simulado")}
        />
        <SettingRow
          title="Login com Google"
          value="Conectado"
          onClick={() => showToast("Conta Google conectada")}
        />
      </Group>
      <Group title="Segurança da conta">
        <SettingRow
          title="Sessões e dispositivos"
          description="2 sessões ativas"
          onClick={openSessions}
        />
        <SettingRow
          title="Recuperação"
          description="E-mail confirmado"
          onClick={() => showToast("Recuperação aberta")}
        />
      </Group>
      <Group title="Seus dados">
        <SettingRow
          title="Exportar meus dados"
          description="Prepare uma cópia do conteúdo da conta"
          onClick={() => showToast("Exportação simulada solicitada")}
        />
      </Group>
      <Group title="Encerrar conta">
        <SettingRow
          title="Desativar conta"
          description="Oculta o perfil e preserva os dados para retorno"
          onClick={() => openDanger("deactivate")}
        />
        <SettingRow
          danger
          title="Excluir conta"
          description="Agenda exclusão definitiva após 30 dias"
          onClick={() => openDanger("delete")}
        />
      </Group>
    </>
  );
}

function PrivacyContent({ showToast }: { showToast: (message: string) => void }) {
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    "Indexação externa": false,
    "Mostrar atividade pública": true,
    "Visitantes com reciprocidade": true,
  });
  const toggle = (key: string) => setSwitches((current) => ({ ...current, [key]: !current[key] }));
  return (
    <>
      <Group title="Descoberta">
        <SettingRow
          title="Quem pode encontrar você"
          value="Usuários aprovados"
          onClick={() => showToast("Audiência da descoberta aberta")}
        />
        <SettingRow
          title="Indexação externa"
          description="Permitir que mecanismos de busca encontrem seu perfil"
          checked={switches["Indexação externa"]}
          onClick={() => toggle("Indexação externa")}
        />
      </Group>
      <Group title="Perfil e relações">
        <SettingRow
          title="Visibilidade do Perfil"
          value="Comunidade"
          onClick={() => showToast("Visibilidade aberta")}
        />
        <SettingRow
          title="Amigos"
          value="Visíveis para Amigos"
          onClick={() => showToast("Privacidade de Amigos aberta")}
        />
        <SettingRow
          title="Visitas ao Perfil"
          description="Você vê visitantes apenas quando também permite ser visto"
          checked={switches["Visitantes com reciprocidade"]}
          onClick={() => toggle("Visitantes com reciprocidade")}
        />
      </Group>
      <Group title="Conteúdo">
        <SettingRow
          title="Publicações"
          value="Lembrar última audiência"
          onClick={() => showToast("Audiência padrão aberta")}
        />
        <SettingRow
          title="Momentos"
          value="Amigos"
          onClick={() => showToast("Privacidade de Momentos aberta")}
        />
        <SettingRow
          title="Mostrar atividade pública"
          checked={switches["Mostrar atividade pública"]}
          onClick={() => toggle("Mostrar atividade pública")}
        />
      </Group>
      <Group title="Proteção">
        <SettingRow
          title="Solicitações de conversa"
          value="Abertas com mensagem curta"
          onClick={() => showToast("Solicitações abertas")}
        />
        <SettingRow
          title="Bloqueados"
          value="3"
          onClick={() => showToast("Lista de bloqueados aberta")}
        />
      </Group>
    </>
  );
}

function NotificationsContent({ showToast }: { showToast: (message: string) => void }) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(
      [
        "Conversas",
        "Amigos",
        "Comunidade",
        "Espaços",
        "Eventos",
        "Cinema",
        "Pets",
        "Arcade",
        "Loja",
        "Verbo",
        "Modo Namoro",
        "Segurança",
      ].map((item) => [item, true]),
    ),
  );
  return (
    <>
      <Group title="Entrega">
        <SettingRow title="Push" checked onClick={() => showToast("Push mantido ativo")} />
        <SettingRow
          title="Dentro do app"
          checked
          onClick={() => showToast("Notificações internas ativas")}
        />
        <SettingRow
          title="E-mail"
          value="Somente segurança"
          onClick={() => showToast("Preferências de e-mail abertas")}
        />
        <SettingRow
          title="Som e vibração"
          value="Ativos"
          onClick={() => showToast("Som e vibração abertos")}
        />
        <SettingRow
          title="Horários silenciosos"
          value="22:30–07:30"
          onClick={() => showToast("Horários silenciosos abertos")}
        />
      </Group>
      <Group title="Por experiência">
        {Object.entries(enabled).map(([item, checked]) => (
          <SettingRow
            key={item}
            title={item}
            checked={checked}
            onClick={() => setEnabled((current) => ({ ...current, [item]: !current[item] }))}
          />
        ))}
      </Group>
    </>
  );
}

function SettingsDetail({
  section,
  showToast,
  appearanceMode,
  onAppearanceChange,
  onOpenDating,
  openSessions,
  openDanger,
}: {
  section: SettingSection;
  showToast: (message: string) => void;
  appearanceMode: ThemeMode;
  onAppearanceChange: (next: ThemeMode) => void;
  onOpenDating: () => void;
  openSessions: () => void;
  openDanger: (mode: "deactivate" | "delete") => void;
}) {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const toggle = (key: string, fallback = true) =>
    setToggles((current) => ({ ...current, [key]: !(current[key] ?? fallback) }));
  const checked = (key: string, fallback = true) => toggles[key] ?? fallback;

  if (section === "Conta")
    return (
      <AccountContent showToast={showToast} openSessions={openSessions} openDanger={openDanger} />
    );
  if (section === "Privacidade") return <PrivacyContent showToast={showToast} />;
  if (section === "Notificações") return <NotificationsContent showToast={showToast} />;

  if (section === "Perfil")
    return (
      <>
        <Group title="Sua identidade">
          {[
            "Identidade e apresentação",
            "Foto e aparência",
            "Minha caminhada",
            "Galeria",
            "Módulos do Perfil",
            "Personalização",
            "Visitantes",
            "URL do Perfil",
          ].map((item) => (
            <SettingRow
              key={item}
              title={item}
              onClick={() => showToast(`${item} aberto no editor existente`)}
            />
          ))}
        </Group>
        <div className="settings-note">
          <Palette size={18} />
          <span>Estas opções levam aos editores existentes sem duplicar o Perfil.</span>
        </div>
      </>
    );

  if (section === "Conversas")
    return (
      <>
        <Group title="Privacidade da conversa">
          <SettingRow
            title="Quem envia solicitação"
            value="Usuários aprovados"
            onClick={() => showToast("Solicitações abertas")}
          />
          {["Confirmação de leitura", "Mostrar presença", "Mostrar quando está digitando"].map(
            (item) => (
              <SettingRow
                key={item}
                title={item}
                checked={checked(item)}
                onClick={() => toggle(item)}
              />
            ),
          )}
        </Group>
        <Group title="Mídia e reprodução">
          <SettingRow
            title="Download automático"
            value="Somente Wi‑Fi"
            onClick={() => showToast("Download automático aberto")}
          />
          <SettingRow
            title="Qualidade de mídia"
            value="Equilibrada"
            onClick={() => showToast("Qualidade aberta")}
          />
          <SettingRow
            title="Reprodução de áudio"
            value="1× · contínua"
            onClick={() => showToast("Áudio aberto")}
          />
        </Group>
        <Group title="Proteção">
          <SettingRow title="Restritos" value="1" />
          <SettingRow title="Bloqueados" value="3" />
        </Group>
      </>
    );

  if (section === "Comunidade")
    return (
      <>
        <Group title="Publicações e Momentos">
          <SettingRow title="Audiência padrão" value="Lembrar última" />
          <SettingRow title="Momentos" value="Amigos" />
          <SettingRow title="Comentários" value="Amigos e contexto" />
          <SettingRow title="Menções" value="Pessoas que sigo" />
        </Group>
        <Group title="Participação">
          {[
            "Convites para Espaços",
            "Convites para eventos",
            "Avisar conteúdo sensível",
            "Atividade pública",
            "Sincronizar salvos",
          ].map((item) => (
            <SettingRow
              key={item}
              title={item}
              checked={checked(item)}
              onClick={() => toggle(item)}
            />
          ))}
        </Group>
      </>
    );

  if (section === "Modo Namoro")
    return (
      <>
        <div className="dating-settings-summary">
          <HeartHandshake size={27} />
          <div>
            <strong>Experiência opcional e privada</strong>
            <span>Nada romântico aparece na Home, Comunidade, Pessoas ou Perfil comum.</span>
          </div>
        </div>
        <Group title="Acesso">
          <SettingRow
            title="Ativar Modo Namoro"
            description="Requisitos atendidos · configuração não concluída"
            onClick={onOpenDating}
          />
          <SettingRow
            title="Requisitos e elegibilidade"
            value="Apto"
            onClick={() => showToast("Elegibilidade aberta")}
          />
          <SettingRow
            title="Privacidade do modo"
            value="Somente participantes ativos"
            onClick={() => showToast("Privacidade aberta")}
          />
        </Group>
        <Group title="Quando estiver ativo">
          <SettingRow
            title="Preferências"
            description="Idade, região, família e interesses"
            onClick={onOpenDating}
          />
          <SettingRow title="Perfil romântico" onClick={onOpenDating} />
          <SettingRow title="Recados anônimos" value="Desativados" onClick={onOpenDating} />
          <SettingRow title="Notificações" value="Discretas" />
          <SettingRow title="Pausar modo" description="Mantém dados e conexões" />
          <SettingRow
            danger
            title="Desativar modo"
            description="Não afeta seu Perfil comunitário"
          />
        </Group>
      </>
    );

  if (section === "Aparência e acessibilidade") {
    return (
      <AppearanceContent
        showToast={showToast}
        theme={appearanceMode}
        updateTheme={(next) => {
          onAppearanceChange(next);
          showToast(
            `Tema ${next === "system" ? "do sistema" : next === "light" ? "claro" : "escuro"} aplicado`,
          );
        }}
      />
    );
  }

  if (section === "Armazenamento e dados")
    return (
      <>
        <div className="storage-summary">
          <div>
            <strong>1,8 GB</strong>
            <span>usados neste dispositivo</span>
          </div>
          <i>
            <b />
          </i>
          <footer>
            <span>Imagens 420 MB</span>
            <span>Vídeos 690 MB</span>
            <span>Áudio 210 MB</span>
            <span>Outros 480 MB</span>
          </footer>
        </div>
        <Group title="Conteúdo armazenado">
          <SettingRow title="Cinema" value="640 MB" />
          <SettingRow title="Verbo e áudio" value="182 MB" />
          <SettingRow title="Downloads" value="8 itens" />
          <SettingRow title="Cache" value="236 MB" />
        </Group>
        <Group title="Uso de dados">
          <SettingRow
            title="Limpar cache"
            description="Não apaga publicações, conversas ou conta"
            onClick={() => showToast("Cache limpo neste protótipo")}
          />
          <SettingRow
            title="Economia de dados"
            checked={checked("Economia", false)}
            onClick={() => toggle("Economia", false)}
          />
          <SettingRow title="Qualidade de upload" value="Equilibrada" />
          <SettingRow
            title="Downloads somente por Wi‑Fi"
            checked={checked("WiFi")}
            onClick={() => toggle("WiFi")}
          />
        </Group>
      </>
    );

  if (section === "PWA e dispositivo")
    return (
      <>
        <div className="pwa-summary">
          <Smartphone size={28} />
          <div>
            <strong>Aplicativo instalado</strong>
            <span>Modo standalone · experiência em tela disponível</span>
          </div>
          <Check size={19} />
        </div>
        <Group title="Permissões deste dispositivo">
          <SettingRow title="Notificações" value="Permitidas" />
          <SettingRow title="Câmera" value="Perguntar" />
          <SettingRow title="Microfone" value="Perguntar" />
          <SettingRow title="Fotos" value="Selecionadas" />
          <SettingRow title="Armazenamento" value="Disponível" />
          <SettingRow title="Localização aproximada" value="Enquanto usa" />
        </Group>
        <Group title="Aplicativo">
          <SettingRow
            title="Instalar neste dispositivo"
            description="Mostra a opção apropriada para este navegador"
            onClick={() => window.dispatchEvent(new CustomEvent("vdn-install-request"))}
          />
          <SettingRow
            title="Verificar atualizações"
            description="Preserva contexto e rascunhos locais"
            onClick={() => window.dispatchEvent(new CustomEvent("vdn-update-ready"))}
          />
        </Group>
        <Group title="Proteção local">
          <SettingRow
            title="Bloqueio com biometria ou código"
            description="Protege a abertura neste dispositivo quando suportado; não substitui o login do servidor"
            checked={checked("Biometria", false)}
            onClick={() => toggle("Biometria", false)}
          />
          <SettingRow
            title="Manter sessão"
            checked={checked("Sessão")}
            onClick={() => toggle("Sessão")}
          />
        </Group>
      </>
    );

  if (section === "Ajuda")
    return (
      <>
        <Group title="Suporte">
          {[
            "Central de ajuda",
            "Reportar um problema",
            "Denunciar abuso",
            "Recuperar minha conta",
            "Segurança da conta",
            "Regras da comunidade",
            "Falar com o suporte",
          ].map((item) => (
            <SettingRow key={item} title={item} onClick={() => showToast(`${item} aberto`)} />
          ))}
        </Group>
        <div className="settings-note">
          <HelpCircle size={18} />
          <span>Em uma emergência, use os canais oficiais apropriados da sua região.</span>
        </div>
      </>
    );

  return (
    <>
      <div className="about-brand">
        <span>VDN</span>
        <h2>VaiDarNamoro</h2>
        <p>Comunidade para viver a fé, criar amizades e construir conexões com propósito.</p>
        <small>Versão do protótipo 1.14</small>
      </div>
      <Group title="Informações">
        <SettingRow title="Termos de uso" />
        <SettingRow title="Política de privacidade" />
        <SettingRow title="Regras da comunidade" />
        <SettingRow title="Licenças de código aberto" />
      </Group>
    </>
  );
}

function SettingsContent({
  onClose,
  onOpenDating,
  showToast,
  appearanceMode,
  onAppearanceChange,
}: {
  onClose: () => void;
  onOpenDating: () => void;
  showToast: (message: string) => void;
  appearanceMode: ThemeMode;
  onAppearanceChange: (next: ThemeMode) => void;
}) {
  const [selected, setSelected] = useState<SettingSection | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SettingsState>("normal");
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [dangerMode, setDangerMode] = useState<"deactivate" | "delete" | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      "settingsState",
    ) as SettingsState | null;
    const requestedSection = new URLSearchParams(window.location.search).get(
      "settingsSection",
    ) as SettingSection | null;
    const initialize = window.setTimeout(() => {
      if (requested) setState(requested);
      if (requestedSection && sections.some((item) => item.title === requestedSection))
        setSelected(requestedSection);
    }, 0);
    return () => window.clearTimeout(initialize);
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sections;
    return sections.filter((item) =>
      `${item.title} ${item.description} ${item.keywords}`.toLowerCase().includes(normalized),
    );
  }, [query]);

  if (state === "error") throw new Error("Settings demo error");

  return (
    <div className="settings-experience">
      <header className="settings-topbar">
        <button aria-label="Voltar" onClick={selected ? () => setSelected(null) : onClose}>
          <ArrowLeft size={21} />
        </button>
        <div>
          <h1>{selected ?? "Configurações"}</h1>
          {selected && <span>Alterações salvas neste protótipo</span>}
        </div>
        {selected ? (
          <button aria-label="Buscar nas Configurações" onClick={() => setSelected(null)}>
            <Search size={20} />
          </button>
        ) : (
          <span />
        )}
      </header>

      {state === "offline" && (
        <div className="settings-state-banner">
          <WifiOff size={17} />
          <span>
            <strong>Você está offline</strong>Algumas alterações serão apenas demonstrativas.
          </span>
        </div>
      )}
      {state === "expired" && (
        <div className="settings-state-banner alert">
          <LockKeyhole size={17} />
          <span>
            <strong>Sessão expirada</strong>Entre novamente antes de alterar dados sensíveis.
          </span>
        </div>
      )}
      {state === "permission" && (
        <div className="settings-state-banner alert">
          <ShieldCheck size={17} />
          <span>
            <strong>Permissão não concedida</strong>Revise a permissão nas configurações do
            dispositivo.
          </span>
        </div>
      )}
      {state === "paused" && (
        <div className="settings-state-banner">
          <Eye size={17} />
          <span>
            <strong>Conta pausada</strong>Seu Perfil está oculto, mas seus dados foram preservados.
          </span>
        </div>
      )}
      {state === "deletion" && (
        <div className="settings-state-banner danger">
          <Trash2 size={17} />
          <span>
            <strong>Exclusão agendada</strong>Você pode cancelar até 26 de agosto.
          </span>
          <button onClick={() => setState("normal")}>Cancelar</button>
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-categories">
          <label className="settings-search">
            <Search size={18} />
            <input
              aria-label="Buscar nas Configurações"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() =>
                window.dispatchEvent(
                  new CustomEvent("vdn-open-global-search", { detail: "Configurações" }),
                )
              }
              placeholder="Buscar nas Configurações"
            />
            <button
              className={query ? "" : "hidden"}
              aria-label="Limpar busca"
              onClick={() => setQuery("")}
            >
              <X size={17} />
            </button>
          </label>
          {state === "loading" ? (
            <div className="settings-loading">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          ) : results.length ? (
            <nav>
              {results.map(({ title, description, icon: Icon }) => (
                <button
                  key={title}
                  className={selected === title ? "active" : ""}
                  onClick={() => setSelected(title)}
                >
                  <span className="settings-category-icon">
                    <Icon size={19} />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </nav>
          ) : (
            <div className="settings-no-results">
              <Search size={27} />
              <h2>Nenhum resultado</h2>
              <p>Tente outro termo ou navegue pelas categorias.</p>
              <button onClick={() => setQuery("")}>Limpar busca</button>
            </div>
          )}
        </aside>

        <main className={`settings-detail ${selected ? "open" : ""}`}>
          {selected ? (
            <>
              <header>
                <span className="settings-category-icon large">
                  {React.createElement(sections.find((item) => item.title === selected)!.icon, {
                    size: 22,
                  })}
                </span>
                <div>
                  <h2>{selected}</h2>
                  <p>{sections.find((item) => item.title === selected)!.description}</p>
                </div>
              </header>
              <SettingsDetail
                section={selected}
                showToast={(message) => {
                  showToast(message);
                }}
                appearanceMode={appearanceMode}
                onAppearanceChange={onAppearanceChange}
                onOpenDating={onOpenDating}
                openSessions={() => setSessionsOpen(true)}
                openDanger={setDangerMode}
              />
            </>
          ) : (
            <div className="settings-detail-empty">
              <SettingsIllustration />
              <h2>Suas escolhas, em um só lugar</h2>
              <p>
                Selecione uma categoria para controlar conta, privacidade, acessibilidade e
                dispositivo.
              </p>
            </div>
          )}
        </main>
      </div>

      {sessionsOpen && (
        <div className="settings-overlay" onMouseDown={() => setSessionsOpen(false)}>
          <section className="settings-sheet" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <h2>Sessões e dispositivos</h2>
              <button onClick={() => setSessionsOpen(false)}>
                <X />
              </button>
            </header>
            <div className="sessions-list">
              <article>
                <Smartphone />
                <div>
                  <strong>Este iPhone</strong>
                  <span>PWA · Peruíbe, SP · agora</span>
                  <small>Sessão atual</small>
                </div>
              </article>
              <article>
                <Smartphone />
                <div>
                  <strong>Windows 10</strong>
                  <span>Chrome · Peruíbe, SP · há 2 horas</span>
                </div>
                <button onClick={() => showToast("Sessão encerrada neste protótipo")}>
                  Encerrar
                </button>
              </article>
            </div>
            <button
              className="end-other-sessions"
              onClick={() => showToast("Outras sessões encerradas")}
            >
              Encerrar todas as outras sessões
            </button>
          </section>
        </div>
      )}

      {dangerMode && (
        <div className="settings-overlay" onMouseDown={() => setDangerMode(null)}>
          <section
            className="settings-sheet danger-sheet"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <h2>{dangerMode === "deactivate" ? "Desativar conta" : "Excluir conta"}</h2>
              <button onClick={() => setDangerMode(null)}>
                <X />
              </button>
            </header>
            {dangerMode === "deactivate" ? (
              <>
                <Eye size={30} />
                <p>
                  Seu Perfil ficará oculto e os dados serão preservados. Você poderá retornar
                  entrando novamente.
                </p>
                <button
                  onClick={() => {
                    setDangerMode(null);
                    setState("paused");
                    showToast("Conta pausada neste protótipo");
                  }}
                >
                  Confirmar desativação
                </button>
              </>
            ) : (
              <>
                <Trash2 size={30} />
                <p>
                  A exclusão será agendada por 30 dias. Durante esse prazo, você poderá cancelar
                  entrando novamente.
                </p>
                <label>
                  Digite EXCLUIR para confirmar
                  <input placeholder="EXCLUIR" />
                </label>
                <button
                  className="delete"
                  onClick={() => {
                    setDangerMode(null);
                    setState("deletion");
                    showToast("Exclusão agendada neste protótipo");
                  }}
                >
                  Agendar exclusão
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SettingsIllustration() {
  return (
    <div className="settings-illustration">
      <ShieldCheck />
      <Palette />
      <Bell />
    </div>
  );
}

export default function SettingsExperience(props: {
  visible: boolean;
  appearanceMode: ThemeMode;
  onAppearanceChange: (next: ThemeMode) => void;
  onClose: () => void;
  onOpenDating: () => void;
  showToast: (message: string) => void;
}) {
  if (!props.visible) return <div className="settings-experience is-hidden" aria-hidden="true" />;
  return (
    <SettingsBoundary onClose={props.onClose}>
      <SettingsContent {...props} />
    </SettingsBoundary>
  );
}
