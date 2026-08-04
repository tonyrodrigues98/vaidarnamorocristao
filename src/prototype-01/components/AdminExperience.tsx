"use client";

import {
  Activity,
  ArrowLeft,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  Clapperboard,
  Database,
  FileClock,
  FolderOpen,
  Headphones,
  Image as ImageIcon,
  LayoutDashboard,
  MessageCircle,
  Package,
  PawPrint,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  UsersRound,
  WifiOff,
  X,
} from "lucide-react";
import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import "../styles/AdminExperience.css";

type AdminRole =
  | "Super Administrador"
  | "Administrador"
  | "Moderador"
  | "Suporte"
  | "Catálogo"
  | "Apresentador";
type AdminState = "normal" | "loading" | "offline" | "empty" | "degraded" | "denied";
type AdminGroup =
  | "Operação"
  | "Pessoas"
  | "Moderação"
  | "Conteúdo"
  | "Relacionamentos"
  | "Catálogo"
  | "Pets e Avatar"
  | "Economia"
  | "Live"
  | "Suporte"
  | "Sistema";

type AdminPage =
  | "Painel"
  | "Verificações"
  | "Fotos"
  | "Pendentes"
  | "Aprovados"
  | "Rejeitados"
  | "Banidos"
  | "Desativados"
  | "Usuários"
  | "Pré-cadastros"
  | "Papéis e permissões"
  | "Denúncias"
  | "Sinalizações"
  | "Palavras restritas"
  | "Texto diário"
  | "Conteúdo"
  | "Interesses e matches"
  | "Presentes"
  | "Stickers"
  | "Fundos"
  | "Molduras"
  | "Auras"
  | "Gradientes de nome"
  | "Avatar"
  | "Pets"
  | "Economia"
  | "Equipe da live"
  | "Cinema"
  | "Suporte"
  | "Sistema"
  | "Auditoria";

type AdminItem = {
  title: string;
  meta: string;
  state: string;
  detail: string;
  owner: string;
  updated: string;
};

type PageDefinition = {
  page: AdminPage;
  icon: typeof LayoutDashboard;
  description: string;
  fields: string[];
  actions: string[];
  roles?: AdminRole[];
};

const allRoles: AdminRole[] = [
  "Super Administrador",
  "Administrador",
  "Moderador",
  "Suporte",
  "Catálogo",
  "Apresentador",
];
const adminRoles: AdminRole[] = ["Super Administrador", "Administrador"];
const moderationRoles: AdminRole[] = ["Super Administrador", "Administrador", "Moderador"];
const catalogRoles: AdminRole[] = ["Super Administrador", "Administrador", "Catálogo"];

const groups: Array<{ group: AdminGroup; pages: PageDefinition[] }> = [
  {
    group: "Operação",
    pages: [
      {
        page: "Painel",
        icon: LayoutDashboard,
        description: "Indicadores e filas operacionais",
        fields: [],
        actions: ["Atualizar"],
      },
      {
        page: "Verificações",
        icon: ShieldCheck,
        description: "Perfil, foto, evidência, recurso e responsável",
        fields: ["Perfil", "Foto", "Estado", "Data", "Evidência", "Recurso", "Responsável"],
        actions: ["Aprovar", "Solicitar correção", "Recusar", "Encaminhar", "Abrir histórico"],
        roles: moderationRoles,
      },
      {
        page: "Fotos",
        icon: ImageIcon,
        description: "Fila visual, origem e decisão humana",
        fields: ["Perfil", "Foto", "Estado", "Sinalização", "Origem", "Comparação"],
        actions: ["Aprovar", "Solicitar ajuste", "Recusar", "Abrir histórico"],
        roles: moderationRoles,
      },
    ],
  },
  {
    group: "Pessoas",
    pages: [
      {
        page: "Pendentes",
        icon: FileClock,
        description: "Perfis aguardando revisão",
        fields: ["Perfil", "Estado", "Data", "Origem", "Responsável"],
        actions: ["Aprovar", "Solicitar correção", "Rejeitar", "Abrir histórico"],
        roles: moderationRoles,
      },
      {
        page: "Aprovados",
        icon: Check,
        description: "Perfis aprovados e responsáveis",
        fields: ["Perfil", "Estado", "Data", "Origem", "Responsável"],
        actions: ["Abrir perfil", "Revisar", "Abrir histórico"],
        roles: moderationRoles,
      },
      {
        page: "Rejeitados",
        icon: CircleAlert,
        description: "Decisões, justificativas e recursos",
        fields: ["Perfil", "Estado", "Data", "Motivo", "Recurso", "Responsável"],
        actions: ["Reavaliar", "Encaminhar", "Abrir histórico"],
        roles: moderationRoles,
      },
      {
        page: "Banidos",
        icon: ShieldAlert,
        description: "Contas banidas com decisão auditável",
        fields: ["Perfil", "Estado", "Data", "Motivo", "Recurso", "Responsável"],
        actions: ["Revisar medida", "Abrir recurso", "Abrir histórico"],
        roles: moderationRoles,
      },
      {
        page: "Desativados",
        icon: UserRound,
        description: "Contas desativadas e restauráveis",
        fields: ["Perfil", "Estado", "Data", "Origem", "Responsável"],
        actions: ["Restaurar", "Abrir histórico"],
        roles: moderationRoles,
      },
      {
        page: "Usuários",
        icon: UsersRound,
        description: "Conta, verificação, suporte, sessões e ações",
        fields: ["Perfil", "Função", "Estado", "Verificação", "Suporte", "Sessões"],
        actions: ["Orientar", "Limitar recurso", "Ver sessões", "Abrir histórico"],
        roles: ["Super Administrador", "Administrador", "Moderador", "Suporte"],
      },
      {
        page: "Pré-cadastros",
        icon: FolderOpen,
        description: "Origem, vínculo e conversão visual",
        fields: ["Dados", "Origem", "Status", "Vínculo", "Observações"],
        actions: ["Editar", "Vincular", "Converter", "Abrir histórico"],
        roles: ["Super Administrador", "Administrador", "Suporte"],
      },
      {
        page: "Papéis e permissões",
        icon: ShieldCheck,
        description: "Papéis administrativos sem impersonação",
        fields: ["Perfil", "Papel", "Escopo", "Estado", "Histórico"],
        actions: ["Trocar papel", "Revisar escopo", "Desativar acesso", "Abrir histórico"],
        roles: adminRoles,
      },
    ],
  },
  {
    group: "Moderação",
    pages: [
      {
        page: "Denúncias",
        icon: ShieldAlert,
        description: "Conteúdo, contexto, risco, recurso e decisão humana",
        fields: ["Conteúdo", "Contexto", "Autor", "Motivo", "Data", "Risco", "Recurso"],
        actions: [
          "Orientar",
          "Ocultar",
          "Restringir",
          "Suspender",
          "Encaminhar",
          "Abrir histórico",
        ],
        roles: moderationRoles,
      },
      {
        page: "Sinalizações",
        icon: CircleAlert,
        description: "Sinais automáticos sujeitos a revisão humana",
        fields: ["Conteúdo", "Contexto", "Origem", "Risco", "Sugestão"],
        actions: ["Descartar sinal", "Abrir denúncia", "Encaminhar", "Abrir histórico"],
        roles: moderationRoles,
      },
      {
        page: "Palavras restritas",
        icon: MessageCircle,
        description: "Termos, severidade, exceções e histórico",
        fields: ["Termo", "Categoria", "Severidade", "Contexto", "Ativo", "Exceções"],
        actions: ["Criar", "Editar", "Duplicar", "Desativar", "Abrir histórico"],
        roles: moderationRoles,
      },
    ],
  },
  {
    group: "Conteúdo",
    pages: [
      {
        page: "Texto diário",
        icon: BookOpen,
        description: "Notícia, devocional, versículo e publicação",
        fields: ["Tipo", "Título", "Conteúdo", "Versículo", "Referência", "Versão", "Agendamento"],
        actions: ["Criar", "Editar", "Abrir preview", "Agendar", "Despublicar", "Abrir histórico"],
        roles: ["Super Administrador", "Administrador", "Moderador"],
      },
      {
        page: "Conteúdo",
        icon: FolderOpen,
        description: "Publicações, mídia e conteúdo editorial",
        fields: ["Título", "Tipo", "Origem", "Estado", "Audiência"],
        actions: ["Editar", "Abrir preview", "Arquivar", "Fixar", "Abrir histórico"],
        roles: moderationRoles,
      },
    ],
  },
  {
    group: "Relacionamentos",
    pages: [
      {
        page: "Interesses e matches",
        icon: Sparkles,
        description: "Interesses, cruzamentos, propósito e histórico",
        fields: ["Perfis", "Interesses", "Cruzamento", "Estado", "Propósito", "Observações"],
        actions: ["Consultar", "Revisar estado", "Adicionar observação", "Abrir histórico"],
        roles: adminRoles,
      },
    ],
  },
  {
    group: "Catálogo",
    pages: [
      {
        page: "Presentes",
        icon: Package,
        description: "CRUD visual de presentes",
        fields: [
          "Nome",
          "Preview",
          "Categoria",
          "Raridade",
          "Preço",
          "Ativo",
          "Presenteável",
          "Limitado",
          "Ordem",
          "Período",
        ],
        actions: ["Criar", "Editar", "Duplicar", "Desativar", "Abrir preview", "Abrir histórico"],
        roles: catalogRoles,
      },
      {
        page: "Stickers",
        icon: MessageCircle,
        description: "Coleções e preview contextual em chat",
        fields: [
          "Coleção",
          "Preview",
          "Nome",
          "Categoria",
          "Preço",
          "Ativo",
          "Ordem",
          "Evento",
          "Compatibilidade",
        ],
        actions: ["Criar", "Editar", "Duplicar", "Desativar", "Preview no chat", "Abrir histórico"],
        roles: catalogRoles,
      },
      {
        page: "Fundos",
        icon: ImageIcon,
        description: "Imagem, animação, paleta e preview de Perfil",
        fields: [
          "Imagem",
          "Animação",
          "Paleta",
          "Contraste",
          "Preço",
          "Raridade",
          "Período",
          "Ativo",
        ],
        actions: [
          "Criar",
          "Editar",
          "Duplicar",
          "Desativar",
          "Preview de Perfil",
          "Abrir histórico",
        ],
        roles: catalogRoles,
      },
      {
        page: "Molduras",
        icon: UserRound,
        description: "Preview circular protegido contra deformação",
        fields: ["Nome", "Raridade", "Preço", "Ativo", "Compatibilidade", "Ordem", "Coleção"],
        actions: ["Criar", "Editar", "Duplicar", "Desativar", "Abrir preview", "Abrir histórico"],
        roles: catalogRoles,
      },
      {
        page: "Auras",
        icon: Sparkles,
        description: "Estática, animada, intensidade e movimento reduzido",
        fields: ["Nome", "Tipo", "Intensidade", "Reduzir movimento", "Preço", "Raridade", "Ativo"],
        actions: ["Criar", "Editar", "Duplicar", "Desativar", "Abrir preview", "Abrir histórico"],
        roles: catalogRoles,
      },
      {
        page: "Gradientes de nome",
        icon: Sparkles,
        description: "Cores, contraste e temas legíveis",
        fields: [
          "Nome",
          "Cores",
          "Contraste",
          "Tema claro",
          "Tema escuro",
          "Raridade",
          "Preço",
          "Ativo",
          "Ordem",
        ],
        actions: [
          "Criar",
          "Editar",
          "Validar contraste",
          "Desativar",
          "Abrir preview",
          "Abrir histórico",
        ],
        roles: catalogRoles,
      },
    ],
  },
  {
    group: "Pets e Avatar",
    pages: [
      {
        page: "Avatar",
        icon: UserRound,
        description: "Categorias, peças, camadas e compatibilidade",
        fields: [
          "Categoria",
          "Peça",
          "Camada",
          "Compatibilidade",
          "Preview",
          "Ativo",
          "Raridade",
          "Preço",
          "Ordem",
        ],
        actions: ["Criar", "Editar", "Reordenar", "Desativar", "Abrir preview", "Abrir histórico"],
        roles: catalogRoles,
      },
      {
        page: "Pets",
        icon: PawPrint,
        description: "Espécies, fases, assets, habitat e animações",
        fields: [
          "Espécie",
          "Variante",
          "Fase",
          "Assets",
          "Itens",
          "Habitat",
          "Animações",
          "Estado",
          "Preço",
          "Ordem",
        ],
        actions: ["Criar", "Editar", "Reordenar", "Desativar", "Abrir preview", "Abrir histórico"],
        roles: catalogRoles,
      },
    ],
  },
  {
    group: "Economia",
    pages: [
      {
        page: "Economia",
        icon: CircleDollarSign,
        description: "Ledger, operações, reversões e suspeitas",
        fields: [
          "Ledger",
          "Saldo",
          "Compra",
          "Presente",
          "Caixa",
          "Recompensa",
          "Reversão",
          "Duplicidade",
        ],
        actions: [
          "Consultar",
          "Lançamento compensatório",
          "Bloquear operação",
          "Revisar",
          "Exportar",
          "Abrir histórico",
        ],
        roles: ["Super Administrador", "Administrador", "Suporte"],
      },
    ],
  },
  {
    group: "Live",
    pages: [
      {
        page: "Equipe da live",
        icon: Activity,
        description: "Equipe, mídia, horários, função e programação",
        fields: ["Perfil", "Função", "Horário", "Status", "Ordem", "Programação"],
        actions: [
          "Adicionar",
          "Editar",
          "Remover",
          "Reordenar",
          "Alterar função",
          "Vincular programação",
        ],
        roles: ["Super Administrador", "Administrador", "Apresentador"],
      },
      {
        page: "Cinema",
        icon: Clapperboard,
        description: "Biblioteca, sessões e moderação",
        fields: ["Título", "Mídia", "Estado", "Sessão", "Host", "Processamento"],
        actions: [
          "Publicar",
          "Ocultar",
          "Criar sessão",
          "Designar host",
          "Reprocessar",
          "Abrir histórico",
        ],
        roles: ["Super Administrador", "Administrador", "Moderador", "Catálogo"],
      },
    ],
  },
  {
    group: "Suporte",
    pages: [
      {
        page: "Suporte",
        icon: Headphones,
        description: "Tickets, responsáveis, vínculos e resolução",
        fields: ["Ticket", "Usuário", "Prioridade", "Responsável", "Vínculos"],
        actions: [
          "Responder",
          "Atribuir",
          "Escalar",
          "Vincular denúncia",
          "Resolver",
          "Abrir histórico",
        ],
        roles: ["Super Administrador", "Administrador", "Suporte"],
      },
    ],
  },
  {
    group: "Sistema",
    pages: [
      {
        page: "Sistema",
        icon: Database,
        description: "Saúde operacional e ações demonstrativas",
        fields: ["Serviço", "Estado", "Última verificação", "Falhas"],
        actions: ["Ver diagnóstico", "Abrir falhas", "Simular manutenção"],
        roles: adminRoles,
      },
      {
        page: "Auditoria",
        icon: FileClock,
        description: "Antes, depois, ator e correlação",
        fields: ["Registro", "Ator", "Ação", "Antes", "Depois", "Correlação"],
        actions: ["Abrir registro", "Exportar", "Abrir correlação"],
        roles: adminRoles,
      },
    ],
  },
];

const pageDefinitions = groups.flatMap((group) => group.pages);
const catalogPages: AdminPage[] = [
  "Presentes",
  "Stickers",
  "Fundos",
  "Molduras",
  "Auras",
  "Gradientes de nome",
  "Avatar",
  "Pets",
];
const moderationPages: AdminPage[] = [
  "Verificações",
  "Fotos",
  "Pendentes",
  "Rejeitados",
  "Banidos",
  "Denúncias",
  "Sinalizações",
];

const sampleNames: Record<string, string[]> = {
  Verificações: [
    "Ana Clara · perfil e foto",
    "Lucas Almeida · nova tentativa",
    "Marina Souza · recurso aberto",
  ],
  Fotos: ["Foto principal · @anaclara", "Galeria · @lucasalmeida", "Foto de Perfil · @marinasouza"],
  Presentes: ["Coração Comunidade", "Presente Caminhos", "Luz de Esperança"],
  Stickers: ["Coleção Comunidade", "Coleção Devocional", "Coleção Cinema"],
  Fundos: ["Horizonte Coral", "Noite Serena", "Comunidade Viva"],
  Molduras: ["Moldura Comunidade", "Moldura Caminhos", "Moldura Aurora"],
  Auras: ["Aura Horizonte", "Aura Propósito", "Aura Serenidade"],
  "Gradientes de nome": ["Coral & Violeta", "Aurora Suave", "Oceano Noturno"],
  Avatar: ["Cabelo Ondulado 04", "Jaqueta Casual 02", "Acessório Óculos 03"],
  Pets: ["Golden · fase adulta", "Gato rajado · filhote", "Calopsita · adulta"],
  Economia: ["LED-92841 · compra", "LED-92822 · presente", "LED-92798 · recompensa"],
  "Equipe da live": ["Caren · apresentadora", "Marina · moderadora", "Lucas · convidado"],
  "Texto diário": [
    "Devocional · João 8",
    "Notícia · Cinema em comunidade",
    "Reflexão · Amizade com propósito",
  ],
  "Palavras restritas": ["Termo sensível 01", "Expressão sob contexto", "Exceção editorial"],
  "Papéis e permissões": [
    "Marina Souza · Moderador",
    "Paulo Lima · Suporte",
    "Caren · Apresentador",
  ],
  "Interesses e matches": [
    "Cruzamento 1182",
    "Match em propósito 927",
    "Interesses compartilhados 541",
  ],
};

function rowsFor(page: AdminPage): AdminItem[] {
  const names = sampleNames[page] ?? [
    `${page} · item prioritário`,
    `${page} · revisão recente`,
    `${page} · registro estável`,
  ];
  return names.map((title, index) => ({
    title,
    meta:
      index === 0
        ? "Requer atenção"
        : index === 1
          ? "Atualizado recentemente"
          : "Histórico disponível",
    state: index === 0 ? "Em revisão" : index === 1 ? "Ativo" : "Concluído",
    detail: catalogPages.includes(page)
      ? "Preview, metadados, compatibilidade, ordem e disponibilidade preservados."
      : page === "Economia"
        ? "Operação registrada no ledger; correção somente por lançamento compensatório."
        : moderationPages.includes(page)
          ? "Contexto, evidência simulada, recurso e decisão humana disponíveis."
          : "Dados demonstrativos organizados sem alterar funções ou registros reais.",
    owner: index === 0 ? "Marina Souza" : index === 1 ? "Paulo Lima" : "Antonio Rodrigues",
    updated: index === 0 ? "há 8 min" : index === 1 ? "hoje, 18:42" : "ontem, 21:10",
  }));
}

const indicators = [
  ["Perfis pendentes", "27", "8 aguardam evidência", FileClock, "warning", "Pendentes"],
  ["Denúncias abertas", "18", "5 de risco alto", ShieldAlert, "critical", "Denúncias"],
  ["Verificações", "14", "3 recursos abertos", ShieldCheck, "warning", "Verificações"],
  ["Tickets", "21", "4 aguardam equipe", Headphones, "neutral", "Suporte"],
  ["Falhas", "3", "Realtime com latência", Activity, "critical", "Sistema"],
  ["Operações econômicas", "2", "Duplicidade sob análise", CircleDollarSign, "warning", "Economia"],
  ["Live e Cinema", "4", "1 sessão em atenção", Clapperboard, "neutral", "Equipe da live"],
  ["Itens para revisão", "31", "Catálogo e conteúdo", Boxes, "warning", "Presentes"],
] as const;

function initialAdminPage(): AdminPage {
  if (typeof window === "undefined") return "Painel";
  const requestedPage = new URLSearchParams(window.location.search).get(
    "adminPage",
  ) as AdminPage | null;
  const storedPage = window.localStorage.getItem("vdn-admin-page") as AdminPage | null;
  if (requestedPage && pageDefinitions.some((item) => item.page === requestedPage))
    return requestedPage;
  if (storedPage && pageDefinitions.some((item) => item.page === storedPage)) return storedPage;
  return "Painel";
}

class AdminBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="admin-local-error" role="alert">
          <CircleAlert size={28} />
          <strong>A Administração encontrou um erro local</strong>
          <span>O App Shell e todas as áreas públicas continuam disponíveis.</span>
          <button onClick={() => this.setState({ failed: false })}>
            <RefreshCw size={16} /> Reabrir Administração
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminExperience({
  visible,
  onClose,
  showToast,
}: {
  visible: boolean;
  onClose: () => void;
  showToast: (message: string) => void;
}) {
  const [role, setRole] = useState<AdminRole>("Super Administrador");
  const [page, setPage] = useState<AdminPage>(initialAdminPage);
  const [mobilePageOpen, setMobilePageOpen] = useState(() => initialAdminPage() !== "Painel");
  const [selectedItem, setSelectedItem] = useState<AdminItem | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [state, setState] = useState<AdminState>("loading");
  const [filterOpen, setFilterOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<AdminGroup[]>(
    groups.map(({ group }) => group),
  );
  const mainRef = useRef<HTMLElement | null>(null);

  const definition = pageDefinitions.find((item) => item.page === page) ?? pageDefinitions[0];
  const allowedGroups = groups
    .map((group) => ({
      ...group,
      pages: group.pages.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.pages.length);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setState(navigator.onLine ? "normal" : "offline"), 260);
    const online = () => setState("normal");
    const offline = () => setState("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (editorOpen) setEditorOpen(false);
      else if (historyOpen) setHistoryOpen(false);
      else if (previewOpen) setPreviewOpen(false);
      else if (selectedItem) setSelectedItem(null);
      else if (mobilePageOpen) setMobilePageOpen(false);
      else onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editorOpen, historyOpen, mobilePageOpen, onClose, previewOpen, selectedItem, visible]);

  const openPage = (next: AdminPage) => {
    setPage(next);
    setMobilePageOpen(true);
    setSelectedItem(null);
    setQuery("");
    setFilter("Todos");
    window.localStorage.setItem("vdn-admin-page", next);
    const url = new URL(window.location.href);
    url.searchParams.set("adminPage", next);
    window.history.replaceState({}, "", url);
    window.requestAnimationFrame(() => mainRef.current?.scrollTo({ top: 0 }));
  };

  const visibleRows = useMemo(() => {
    const rows = rowsFor(page);
    const normalized = query.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesQuery =
        !normalized ||
        `${item.title} ${item.meta} ${item.state} ${item.detail}`
          .toLowerCase()
          .includes(normalized);
      const matchesFilter =
        filter === "Todos" ||
        item.state === filter ||
        (filter === "Atenção" && item.meta.includes("atenção"));
      return matchesQuery && matchesFilter;
    });
  }, [filter, page, query]);

  const saveEditor = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setPendingChanges(false);
      setEditorOpen(false);
      showToast(`${page} salvo visualmente`);
    }, 520);
  };

  if (!visible) return null;

  return (
    <AdminBoundary>
      <section
        className="admin-experience admin-v1-specialized"
        aria-label="Administração especializada V1"
      >
        <header className="admin-global-header">
          <button onClick={onClose} aria-label="Fechar Administração">
            <X size={20} />
          </button>
          <div>
            <span>VAIDARNAMORO</span>
            <strong>Administração V1</strong>
          </div>
          <button
            onClick={() => showToast("Nenhuma nova falha crítica")}
            aria-label="Estado operacional"
          >
            <Activity size={19} />
            <i />
          </button>
        </header>

        <div className="admin-layout">
          <aside className={`admin-sidebar ${mobilePageOpen ? "mobile-hidden" : ""}`}>
            <div className="admin-role-card">
              <span className="admin-avatar">AR</span>
              <div>
                <strong>Antonio Rodrigues</strong>
                <small>{role}</small>
              </div>
              <ShieldCheck size={18} />
            </div>
            <label className="admin-role-selector">
              <span>Visualizar permissões</span>
              <select
                value={role}
                onChange={(event) => {
                  const next = event.target.value as AdminRole;
                  setRole(next);
                  const currentAllowed = !definition.roles || definition.roles.includes(next);
                  if (!currentAllowed) openPage("Painel");
                  showToast(`Permissões de ${next}`);
                }}
              >
                {allRoles.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <nav className="admin-group-navigation" aria-label="Páginas administrativas V1">
              {allowedGroups.map(({ group, pages }) => {
                const expanded = expandedGroups.includes(group);
                return (
                  <section key={group}>
                    <button
                      className="admin-group-toggle"
                      aria-expanded={expanded}
                      onClick={() =>
                        setExpandedGroups((current) =>
                          current.includes(group)
                            ? current.filter((item) => item !== group)
                            : [...current, group],
                        )
                      }
                    >
                      <span>{group}</span>
                      <ChevronDown size={15} />
                    </button>
                    {expanded &&
                      pages.map(({ page: itemPage, icon: Icon }) => (
                        <button
                          key={itemPage}
                          className={page === itemPage ? "active" : ""}
                          onClick={() => openPage(itemPage)}
                        >
                          <Icon size={17} />
                          <span>{itemPage}</span>
                          {itemPage === "Denúncias" && <em>18</em>}
                          <ChevronRight size={15} />
                        </button>
                      ))}
                  </section>
                );
              })}
            </nav>
            <div className="admin-sidebar-foot">
              <ShieldCheck size={15} />
              <span>Sem impersonação. Toda ação crítica mantém histórico e responsável.</span>
            </div>
          </aside>

          <main className={`admin-main ${mobilePageOpen ? "mobile-open" : ""}`} ref={mainRef}>
            <header className="admin-module-header">
              <button
                className="admin-mobile-back"
                onClick={() => setMobilePageOpen(false)}
                aria-label="Voltar aos grupos"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <span className="section-overline">
                  {groups
                    .find((group) => group.pages.some((item) => item.page === page))
                    ?.group.toUpperCase()}
                </span>
                <h1>{page}</h1>
              </div>
              <button className="admin-filter-button" onClick={() => setFilterOpen(true)}>
                <SlidersHorizontal size={17} />
                <span>Filtros</span>
              </button>
            </header>

            {state === "offline" && (
              <div className="admin-status-banner">
                <WifiOff size={17} />
                <span>
                  <strong>Admin offline</strong>
                  <small>Consultas e alterações permanecem demonstrativas.</small>
                </span>
              </div>
            )}
            {state === "degraded" && (
              <div className="admin-status-banner critical">
                <CircleAlert size={17} />
                <span>
                  <strong>Sistema parcialmente degradado</strong>
                  <small>A falha ficou contida nesta área.</small>
                </span>
              </div>
            )}
            {state === "denied" && (
              <div className="admin-status-banner critical">
                <ShieldAlert size={17} />
                <span>
                  <strong>Sem permissão</strong>
                  <small>Este papel não pode executar a ação solicitada.</small>
                </span>
              </div>
            )}

            {state === "loading" ? (
              <div className="admin-loading" aria-label="Carregando Administração">
                <span />
                <span />
                <span />
                <span />
              </div>
            ) : page === "Painel" ? (
              <AdminDashboard openPage={openPage} showToast={showToast} />
            ) : (
              <div className="admin-module-content">
                <div className="admin-specialized-intro">
                  <div>
                    <span className="section-overline">PÁGINA V1 PRESERVADA</span>
                    <h2>{definition.description}</h2>
                    <p>{definition.fields.join(" · ")}</p>
                  </div>
                  {definition.actions.some(
                    (action) => action === "Criar" || action === "Adicionar",
                  ) && (
                    <button
                      onClick={() => {
                        setPendingChanges(false);
                        setEditorOpen(true);
                      }}
                    >
                      <Plus size={16} />{" "}
                      {definition.actions.includes("Adicionar") ? "Adicionar" : "Criar"}
                    </button>
                  )}
                </div>

                <div className="admin-toolbar">
                  <label>
                    <Search size={17} />
                    <input
                      aria-label={`Buscar em ${page}`}
                      type="search"
                      inputMode="search"
                      enterKeyHint="search"
                      autoComplete="off"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={`Buscar em ${page}`}
                    />
                  </label>
                  <div>
                    {["Todos", "Atenção", "Em revisão", "Ativo"].map((item) => (
                      <button
                        key={item}
                        className={filter === item ? "selected" : ""}
                        onClick={() => setFilter(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {state === "empty" || !visibleRows.length ? (
                  <div className="admin-empty">
                    <Search size={26} />
                    <strong>Nenhum resultado</strong>
                    <span>Ajuste a busca ou limpe os filtros.</span>
                    <button
                      onClick={() => {
                        setQuery("");
                        setFilter("Todos");
                        setState("normal");
                      }}
                    >
                      Limpar filtros
                    </button>
                  </div>
                ) : (
                  <div
                    className={`admin-data-list ${catalogPages.includes(page) ? "catalog-view" : ""}`}
                  >
                    {visibleRows.map((item) => (
                      <button key={item.title} onClick={() => setSelectedItem(item)}>
                        <AdminItemPreview page={page} item={item} />
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.meta}</small>
                          <p>{item.detail}</p>
                        </span>
                        <em>{item.state}</em>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

          {selectedItem && (
            <aside className="admin-detail-panel" aria-label={`Detalhes de ${selectedItem.title}`}>
              <header>
                <div>
                  <span className="section-overline">DETALHES E AÇÕES</span>
                  <h2>{page}</h2>
                </div>
                <button onClick={() => setSelectedItem(null)} aria-label="Fechar detalhes">
                  <X size={20} />
                </button>
              </header>
              <div className="admin-detail-body">
                <div className="admin-case-summary">
                  <span className="admin-detail-state">{selectedItem.state}</span>
                  <h3>{selectedItem.title}</h3>
                  <p>{selectedItem.meta}</p>
                </div>
                <AdminLargePreview page={page} item={selectedItem} />
                <section>
                  <span className="section-overline">CAMPOS DA PÁGINA</span>
                  <dl>
                    {definition.fields.map((field, index) => (
                      <div key={field}>
                        <dt>{field}</dt>
                        <dd>
                          {index === 0
                            ? selectedItem.title
                            : index === 1
                              ? selectedItem.state
                              : "Dado demonstrativo"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
                {moderationPages.includes(page) && (
                  <div className="admin-ai-suggestion">
                    <Sparkles size={17} />
                    <div>
                      <strong>Sugestão automática — requer decisão humana</strong>
                      <p>Revisar o contexto e a evidência antes de qualquer medida.</p>
                    </div>
                  </div>
                )}
                {page === "Economia" && (
                  <div className="admin-no-impersonation">
                    <ShieldCheck size={16} /> O saldo não pode ser editado diretamente. Correções
                    usam lançamento compensatório auditável.
                  </div>
                )}
                {page === "Papéis e permissões" && (
                  <div className="admin-no-impersonation">
                    <ShieldCheck size={16} /> Impersonação não está disponível.
                  </div>
                )}
                <div className="admin-action-grid">
                  {definition.actions.map((action) => (
                    <button
                      key={action}
                      className={
                        action.includes("Recusar") ||
                        action.includes("Banir") ||
                        action.includes("Remover")
                          ? "danger"
                          : ""
                      }
                      onClick={() => {
                        if (action.includes("histórico")) setHistoryOpen(true);
                        else if (action.includes("preview") || action.includes("Preview"))
                          setPreviewOpen(true);
                        else if (
                          action === "Editar" ||
                          action === "Trocar papel" ||
                          action.includes("compensatório")
                        ) {
                          setPendingChanges(false);
                          setEditorOpen(true);
                        } else showToast(`${action} — ação simulada e auditável`);
                      }}
                    >
                      {action}
                      <ChevronRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>

        {filterOpen && (
          <AdminModal title={`Filtros · ${page}`} onClose={() => setFilterOpen(false)}>
            <div className="admin-filter-sheet">
              {["Estado", "Responsável", "Período", "Origem", "Risco"].map((label) => (
                <label key={label}>
                  {label}
                  <select>
                    <option>Todos</option>
                    <option>Requer atenção</option>
                    <option>Recentes</option>
                  </select>
                </label>
              ))}
              <button
                onClick={() => {
                  setFilterOpen(false);
                  showToast("Filtros aplicados");
                }}
              >
                Aplicar filtros
              </button>
              <button
                onClick={() => {
                  setFilter("Todos");
                  setQuery("");
                  setFilterOpen(false);
                }}
              >
                Limpar filtros
              </button>
              <button
                onClick={() => {
                  setState(state === "empty" ? "normal" : "empty");
                  setFilterOpen(false);
                }}
              >
                Demonstrar estado vazio
              </button>
              {page === "Sistema" && (
                <button
                  onClick={() => {
                    setState("degraded");
                    setFilterOpen(false);
                  }}
                >
                  Demonstrar falha local
                </button>
              )}
            </div>
          </AdminModal>
        )}

        {editorOpen && (
          <AdminModal
            title={`${selectedItem ? "Editar" : definition.actions.includes("Adicionar") ? "Adicionar" : "Criar"} · ${page}`}
            onClose={() => {
              setEditorOpen(false);
              setPendingChanges(false);
            }}
          >
            <div className="admin-editor-form">
              {pendingChanges && (
                <div className="admin-pending-banner">
                  <CircleAlert size={16} /> Alterações pendentes
                </div>
              )}
              {definition.fields.slice(0, 7).map((field, index) => (
                <label key={field}>
                  {field}
                  {field.includes("Ativo") ||
                  field.includes("Limitado") ||
                  field.includes("Presenteável") ? (
                    <select
                      onChange={() => setPendingChanges(true)}
                      defaultValue={index % 2 ? "Não" : "Sim"}
                    >
                      <option>Sim</option>
                      <option>Não</option>
                    </select>
                  ) : field.includes("Conteúdo") || field.includes("Observações") ? (
                    <textarea
                      defaultValue={selectedItem?.detail ?? ""}
                      onChange={() => setPendingChanges(true)}
                    />
                  ) : (
                    <input
                      defaultValue={
                        index === 0
                          ? (selectedItem?.title ?? "")
                          : index === 1
                            ? (selectedItem?.state ?? "")
                            : "Dado demonstrativo"
                      }
                      onChange={() => setPendingChanges(true)}
                    />
                  )}
                </label>
              ))}
              <div className="admin-editor-preview">
                <AdminLargePreview page={page} item={selectedItem ?? rowsFor(page)[0]} />
                <span>Preview visual antes de salvar</span>
              </div>
              <div className="admin-editor-actions">
                <button
                  className="secondary"
                  onClick={() => {
                    setEditorOpen(false);
                    setPendingChanges(false);
                  }}
                >
                  Cancelar
                </button>
                <button disabled={!pendingChanges || saving} onClick={saveEditor}>
                  {saving ? "Salvando…" : "Salvar alterações"}
                </button>
              </div>
            </div>
          </AdminModal>
        )}

        {previewOpen && (
          <AdminModal title={`Preview · ${page}`} onClose={() => setPreviewOpen(false)}>
            <div className="admin-preview-modal">
              <AdminLargePreview page={page} item={selectedItem ?? rowsFor(page)[0]} />
              <strong>{selectedItem?.title}</strong>
              <p>Preview demonstrativo em tema claro e escuro, sem alterar assets reais.</p>
              <button onClick={() => setPreviewOpen(false)}>Fechar preview</button>
            </div>
          </AdminModal>
        )}

        {historyOpen && (
          <AdminModal
            title={`Histórico · ${selectedItem?.title ?? page}`}
            onClose={() => setHistoryOpen(false)}
          >
            <div className="admin-history-list">
              {[
                "Item aberto para revisão",
                "Metadados atualizados",
                "Responsável atribuído",
                "Registro criado",
              ].map((label, index) => (
                <article key={label}>
                  <i />
                  <div>
                    <strong>{label}</strong>
                    <span>
                      {index === 0 ? "Agora" : `${index + 1} h atrás`} ·{" "}
                      {selectedItem?.owner ?? "Sistema"}
                    </span>
                    <small>Antes e depois preservados na auditoria visual.</small>
                  </div>
                </article>
              ))}
            </div>
          </AdminModal>
        )}
      </section>
    </AdminBoundary>
  );
}

function AdminDashboard({
  openPage,
  showToast,
}: {
  openPage: (page: AdminPage) => void;
  showToast: (message: string) => void;
}) {
  return (
    <div className="admin-overview">
      <div className="admin-intro">
        <div>
          <span className="section-overline">SEGUNDA, 28 DE JULHO</span>
          <h2>O que precisa de atenção agora</h2>
          <p>Somente indicadores operacionais; nenhum gráfico decorativo.</p>
        </div>
        <button onClick={() => showToast("Painel operacional atualizado")}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>
      <div className="admin-indicator-grid">
        {indicators.map(([label, value, detail, Icon, tone, destination]) => (
          <button
            key={label}
            className={`admin-indicator ${tone}`}
            onClick={() => openPage(destination as AdminPage)}
          >
            <span>
              <Icon size={18} />
            </span>
            <div>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>{detail}</p>
            </div>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <section className="admin-priority-list">
        <div className="admin-section-heading">
          <div>
            <span className="section-overline">PRIORIDADE</span>
            <h3>Fila mais urgente</h3>
          </div>
          <button onClick={() => openPage("Denúncias")}>Abrir fila</button>
        </div>
        {rowsFor("Denúncias").map((item, index) => (
          <button
            key={item.title}
            onClick={() => openPage(index === 2 ? "Verificações" : "Denúncias")}
          >
            <span
              className={`admin-risk risk-${index === 0 ? "alto" : index === 1 ? "médio" : "baixo"}`}
            >
              {index === 0 ? "Alto" : index === 1 ? "Médio" : "Baixo"}
            </span>
            <div>
              <strong>{item.title}</strong>
              <small>
                {item.updated} · {item.owner}
              </small>
            </div>
            <ChevronRight size={17} />
          </button>
        ))}
      </section>
    </div>
  );
}

function AdminItemPreview({ page }: { page: AdminPage; item: AdminItem }) {
  if (page === "Molduras")
    return (
      <span className="admin-circular-preview">
        <i />
        <b />
      </span>
    );
  if (page === "Gradientes de nome") return <span className="admin-name-gradient">Antonio</span>;
  if (page === "Fundos") return <span className="admin-background-preview" />;
  if (page === "Auras")
    return (
      <span className="admin-aura-preview">
        <i />
      </span>
    );
  if (page === "Stickers")
    return (
      <span className="admin-sticker-preview">
        <MessageCircle size={18} />
      </span>
    );
  if (page === "Pets")
    return (
      <span className="admin-module-icon">
        <PawPrint size={19} />
      </span>
    );
  if (page === "Economia")
    return (
      <span className="admin-module-icon">
        <CircleDollarSign size={19} />
      </span>
    );
  if (page === "Equipe da live")
    return (
      <span className="admin-module-icon">
        <Activity size={19} />
      </span>
    );
  if (page === "Fotos")
    return (
      <span className="admin-module-icon">
        <ImageIcon size={19} />
      </span>
    );
  return (
    <span className="admin-module-icon">
      {catalogPages.includes(page) ? (
        <Package size={19} />
      ) : moderationPages.includes(page) ? (
        <ShieldAlert size={19} />
      ) : (
        <FolderOpen size={19} />
      )}
    </span>
  );
}

function AdminLargePreview({ page, item }: { page: AdminPage; item: AdminItem }) {
  if (page === "Molduras")
    return (
      <div className="admin-large-preview circular">
        <span>
          <i />
          <b />
        </span>
        <small>Avatar 1:1 · sem deformação</small>
      </div>
    );
  if (page === "Gradientes de nome")
    return (
      <div className="admin-large-preview gradient-name">
        <strong>Antonio Rodrigues</strong>
        <small>Contraste validado em claro e escuro</small>
      </div>
    );
  if (page === "Fundos")
    return (
      <div className="admin-large-preview profile-background">
        <i />
        <strong>Preview de Perfil</strong>
        <small>Paleta e mídia natural preservadas</small>
      </div>
    );
  if (page === "Auras")
    return (
      <div className="admin-large-preview aura">
        <i />
        <strong>{item.title}</strong>
        <small>Movimento reduzido compatível</small>
      </div>
    );
  if (page === "Stickers")
    return (
      <div className="admin-large-preview chat-preview">
        <span>Que bom ver você por aqui!</span>
        <i>
          <MessageCircle size={19} />
        </i>
        <small>Preview contextual em chat</small>
      </div>
    );
  if (page === "Fotos" || page === "Verificações")
    return (
      <div className="admin-large-preview comparison">
        <span>
          <UserRound />
        </span>
        <span>
          <ImageIcon />
        </span>
        <small>Comparação visual simulada · sem reconhecimento facial</small>
      </div>
    );
  return (
    <div className="admin-large-preview generic">
      <AdminItemPreview page={page} item={item} />
      <strong>{item.title}</strong>
      <small>{item.detail}</small>
    </div>
  );
}

function AdminModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="section-overline">ADMINISTRAÇÃO V1</span>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default AdminExperience;
