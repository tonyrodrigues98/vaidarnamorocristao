import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookHeart,
  CalendarDays,
  Camera,
  Check,
  CircleDollarSign,
  Clock,
  Coins,
  Filter,
  Gift,
  Heart,
  HeartHandshake,
  Lock,
  MessageCircle,
  PenLine,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  adminRows,
  adminStats,
  allStoreItems,
  auraItems,
  communityPosts,
  conversations,
  currentUser,
  devotionals,
  frameItems,
  getConversation,
  getProfile,
  gifts,
  news,
  prayers,
  profiles,
  stickerItems,
  storeItems,
  tickets,
  type MockProfile,
} from "@/data/mockApp";
import {
  actionIcons,
  AdminFrame,
  BadgePill,
  Breadcrumbs,
  ChatMock,
  DataTable,
  GiftCard,
  GiftModal,
  GlassCard,
  GradientText,
  MiniProfiles,
  MockModal,
  MockTabs,
  PageHeader,
  PremiumIcon,
  PrimaryButton,
  ProfileAvatar,
  ProfileCard,
  SearchBar,
  SecondaryButton,
  StatCard,
  StoreItemCard,
} from "./MockUI";

function Shell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`relative overflow-hidden ${className}`}>{children}</div>;
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </section>
  );
}

function CompactList({
  items,
}: {
  items: { title: string; text: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <GlassCard key={item.title} className="p-5">
          <PremiumIcon>{item.icon ?? actionIcons.star}</PremiumIcon>
          <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </GlassCard>
      ))}
    </div>
  );
}

export function HomeLanding() {
  return (
    <Shell className="bg-neutral-50">
      <section className="mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-10 px-5 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Live oficial e comunidade
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
            <GradientText>VaiDarNamoro Cristao</GradientText>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Um prototipo navegavel para visualizar uma plataforma crista de relacionamento com
            maturidade, seguranca, comunidade e proposito.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <PrimaryButton href="/inicio" icon={<HeartHandshake className="h-4 w-4" />}>
              Acessar comunidade
            </PrimaryButton>
            <SecondaryButton href="https://www.tiktok.com" icon={<Sparkles className="h-4 w-4" />}>
              Ver live no TikTok
            </SecondaryButton>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {["Maior de idade", "Cristao praticante", "Solteiro, viuvo ou divorciado"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 shadow-sm"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <GlassCard className="overflow-hidden p-4">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=80"
            alt="Comunidade crista reunida"
            className="h-[460px] w-full rounded-[1.25rem] object-cover"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatCard label="Pessoas na live" value="2.8k" icon={<Users className="h-5 w-5" />} />
            <StatCard label="Interesses" value="436" icon={<Heart className="h-5 w-5" />} />
            <StatCard label="Oracoes" value="128" icon={<BookHeart className="h-5 w-5" />} />
          </div>
        </GlassCard>
      </section>

      <Section>
        <CompactList
          items={[
            {
              title: "Como funciona",
              text: "Perfil claro, participacao respeitosa na live e conexoes sugeridas por valores.",
              icon: <ShieldCheck className="h-5 w-5" />,
            },
            {
              title: "Quem faz acontecer",
              text: "Equipe da live, moderacao, comunidade e contribuidores mantendo o ambiente saudavel.",
              icon: <Users className="h-5 w-5" />,
            },
            {
              title: "Como participar",
              text: "Entre na comunidade, complete seu perfil e acompanhe os momentos ao vivo.",
              icon: <Sparkles className="h-5 w-5" />,
            },
          ]}
        />
      </Section>

      <Section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <GlassCard className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Top 3 mensal
          </p>
          <h2 className="mt-3 text-3xl font-semibold">
            Destaques com postura, presenca e respeito.
          </h2>
          <p className="mt-3 text-muted-foreground">
            O ranking visual celebra participacao saudavel e perfis bem cuidados, sem transformar
            pessoas em competicao.
          </p>
          <div className="mt-6">
            <MiniProfiles />
          </div>
        </GlassCard>
        <div className="grid gap-4 sm:grid-cols-3">
          {profiles.slice(0, 3).map((profile, index) => (
            <GlassCard key={profile.id} className="p-5 text-center">
              <ProfileAvatar profile={profile} size="lg" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500">
                #{index + 1}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.ministry}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      <Section>
        <GlassCard className="p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-4xl font-semibold">
                Comunidade, devocionais, presentes e conversa com proposito.
              </h2>
              <p className="mt-4 text-muted-foreground">
                A home publica mostra o caminho completo ate o app interno, mantendo tudo acessivel
                no prototipo.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["FAQ", "Depoimentos", "Blog", "Suporte"].map((item) => (
                <a
                  key={item}
                  href={`/${item.toLowerCase() === "faq" ? "como-funciona" : item.toLowerCase()}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 font-semibold shadow-sm transition hover:bg-neutral-50"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </GlassCard>
      </Section>
    </Shell>
  );
}

export function LoginPage() {
  return (
    <AuthFrame
      title="Entrar na comunidade"
      text="Acesso visual para explorar o prototipo completo."
      actionLabel="Entrar"
      onAction={() => {
        toast.success("Login simulado no prototipo.");
        window.location.href = "/inicio";
      }}
    />
  );
}

export function ForgotPasswordPage() {
  return (
    <AuthFrame
      title="Recuperar senha"
      text="Informe seu email e receba uma confirmacao visual."
      actionLabel="Enviar instrucao"
      onAction={() => toast.success("Email de recuperacao simulado.")}
      simple
    />
  );
}

export function ResetPasswordPage() {
  return (
    <AuthFrame
      title="Criar nova senha"
      text="Simule a troca de senha sem depender de backend."
      actionLabel="Confirmar nova senha"
      onAction={() => toast.success("Senha atualizada visualmente.")}
      simple
    />
  );
}

function AuthFrame({
  title,
  text,
  actionLabel,
  onAction,
  simple,
}: {
  title: string;
  text: string;
  actionLabel: string;
  onAction: () => void;
  simple?: boolean;
}) {
  return (
    <Section className="grid min-h-[calc(100vh-180px)] items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div>
        <Breadcrumbs items={["Acesso"]} />
        <h1 className="text-5xl font-semibold leading-tight">
          <GradientText>{title}</GradientText>
        </h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-muted-foreground">{text}</p>
        <GlassCard className="mt-8 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-neutral-900" />
            <p className="text-sm leading-6 text-muted-foreground">
              Todo fluxo desta versao e publico, visual e alimentado por dados mockados locais.
            </p>
          </div>
        </GlassCard>
      </div>
      <GlassCard className="p-6">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input
              className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-neutral-950"
              placeholder="antonio@email.com"
            />
          </label>
          {!simple ? (
            <label className="grid gap-2 text-sm font-semibold">
              Senha
              <input
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-neutral-950"
                type="password"
                placeholder="********"
              />
            </label>
          ) : null}
          <PrimaryButton onClick={onAction} icon={<Lock className="h-4 w-4" />}>
            {actionLabel}
          </PrimaryButton>
          {!simple ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <SecondaryButton onClick={() => toast.info("Google visual acionado.")}>
                  Google
                </SecondaryButton>
                <SecondaryButton onClick={() => toast.info("Facebook visual acionado.")}>
                  Facebook
                </SecondaryButton>
              </div>
              <div className="flex flex-wrap justify-between gap-3 text-sm">
                <a href="/auth/signup" className="font-semibold text-neutral-950">
                  Criar cadastro
                </a>
                <a
                  href="/auth/forgot-password"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Esqueci a senha
                </a>
              </div>
            </>
          ) : null}
        </div>
      </GlassCard>
    </Section>
  );
}

export function SignupPage() {
  const [step, setStep] = useState(0);
  const steps = ["Dados", "Fe", "Intencao", "Foto", "Preview"];

  return (
    <Section className="min-h-[calc(100vh-180px)]">
      <Breadcrumbs items={["Cadastro"]} />
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h1 className="text-5xl font-semibold">Cadastro em steps modernos.</h1>
          <p className="mt-4 text-muted-foreground">
            Um wizard visual para simular entrada, fe, preferencias e preview do perfil.
          </p>
          <div className="mt-6 grid gap-2">
            {steps.map((label, index) => (
              <button
                key={label}
                onClick={() => setStep(index)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${step === index ? "border-neutral-950 bg-neutral-100 text-neutral-950" : "border-neutral-200 bg-white text-neutral-600"}`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
        </div>
        <GlassCard className="p-6">
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-neutral-950 transition-all"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
          <SignupStep step={step} />
          <div className="mt-6 flex justify-between gap-3">
            <SecondaryButton onClick={() => setStep((value) => Math.max(0, value - 1))}>
              Voltar
            </SecondaryButton>
            <PrimaryButton
              onClick={() => {
                if (step === steps.length - 1) {
                  toast.success("Cadastro visual concluido.");
                  window.location.href = "/inicio";
                  return;
                }
                setStep((value) => Math.min(steps.length - 1, value + 1));
              }}
            >
              {step === steps.length - 1 ? "Finalizar" : "Continuar"}
            </PrimaryButton>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
}

function SignupStep({ step }: { step: number }) {
  if (step === 4) {
    return (
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <ProfileAvatar profile={profiles[0]} size="xl" />
        <div>
          <h2 className="text-3xl font-semibold">Antonio Rodrigues</h2>
          <p className="mt-2 text-muted-foreground">{currentUser.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {currentUser.badges.map((badge) => (
              <BadgePill key={badge.label} badge={badge} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const fields = [
    ["Nome", "Antonio Rodrigues"],
    ["Cidade", "Peruibe"],
    ["Igreja", "Comunidade Crista Vida"],
    ["Intencao", "Relacionamento com proposito"],
  ];

  return (
    <div className="grid gap-4">
      <h2 className="text-3xl font-semibold">
        {["Dados basicos", "Fe e igreja", "Intencao", "Foto e aceite"][step]}
      </h2>
      {fields.slice(0, step === 0 ? 2 : 4).map(([label, placeholder]) => (
        <label key={label} className="grid gap-2 text-sm font-semibold">
          {label}
          <input
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-neutral-950"
            placeholder={placeholder}
          />
        </label>
      ))}
      <div className="flex flex-wrap gap-2">
        {["Fe", "Familia", "Maturidade", "Servico", "Oracao"].map((chip) => (
          <button
            key={chip}
            className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OnboardingPage({ step }: { step: 1 | 2 }) {
  return (
    <Section>
      <Breadcrumbs items={["Onboarding", `Etapa ${step}`]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <GlassCard className="p-6">
          <h1 className="text-4xl font-semibold">
            {step === 1 ? "Sobre voce" : "O que voce busca"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {step === 1
              ? "Campos visuais para montar a primeira versao do perfil."
              : "Preferencias simuladas com chips, radios e alcance visual."}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {(step === 1
              ? ["Nome", "Idade", "Cidade", "Igreja", "Bio", "Foto"]
              : ["Faixa de idade", "Estado", "Distancia", "Estado civil", "Ritmo", "Ministerio"]
            ).map((field) => (
              <label key={field} className="grid gap-2 text-sm font-semibold">
                {field}
                <input
                  className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-neutral-950"
                  placeholder={field}
                />
              </label>
            ))}
          </div>
          <div className="mt-6">
            <PrimaryButton onClick={() => toast.success("Onboarding salvo visualmente.")}>
              Salvar etapa
            </PrimaryButton>
          </div>
        </GlassCard>
        <ProfileCard profile={profiles[0]} />
      </div>
    </Section>
  );
}

export function InicioPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Comunidade"
        title={
          <>
            Boa noite, <GradientText>{currentUser.name.split(" ")[0]}</GradientText>
          </>
        }
        description="Seu painel pessoal com perfil, moedas, proximos passos, devocionais e atalhos para a jornada."
        actions={
          <PrimaryButton href="/pretendentes" icon={<Heart className="h-4 w-4" />}>
            Ver pretendentes
          </PrimaryButton>
        }
      />
      <Section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completude"
          value="92%"
          detail="Perfil pronto para boas conversas"
          icon={<BadgeCheck className="h-5 w-5" />}
        />
        <StatCard
          label="Moedas"
          value={currentUser.coins}
          detail="Saldo visual"
          icon={<Coins className="h-5 w-5" />}
        />
        <StatCard
          label="Interesses"
          value="14"
          detail="4 novos esta semana"
          icon={<Heart className="h-5 w-5" />}
        />
        <StatCard
          label="Matches"
          value="6"
          detail="2 conversas ativas"
          icon={<MessageCircle className="h-5 w-5" />}
        />
      </Section>
      <Section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <GlassCard className="p-6">
          <h2 className="text-3xl font-semibold">Proximos passos</h2>
          <div className="mt-5 grid gap-3">
            {[
              "Completar preferencias",
              "Enviar uma mensagem com contexto",
              "Ler o devocional do dia",
              "Explorar a loja premium",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-sm font-semibold text-neutral-900">
                  {index + 1}
                </span>
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-2xl font-semibold">Proposito Firmado</h2>
          <p className="mt-2 text-muted-foreground">
            17 dias de jornada com Ana Clara, capsula do tempo e versiculo do casal.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <ProfileAvatar profile={profiles[0]} size="md" />
            <ProfileAvatar profile={profiles[6]} size="md" />
          </div>
          <PrimaryButton
            href="/proposito/ana-clara"
            icon={<HeartHandshake className="h-4 w-4" />}
            className=""
          >
            Abrir jornada
          </PrimaryButton>
        </GlassCard>
      </Section>
      <Section className="grid gap-4 md:grid-cols-4">
        {[
          ["/loja", "Loja", ShoppingBag],
          ["/presentes", "Presentes", Gift],
          ["/devocional", "Devocional", BookHeart],
          ["/oracoes", "Oracoes", HeartHandshake],
        ].map(([href, label, Icon]) => (
          <a
            key={href as string}
            href={href as string}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
          >
            <Icon className="h-5 w-5 text-neutral-900" />
            <p className="mt-4 font-semibold">{label as string}</p>
          </a>
        ))}
      </Section>
    </Shell>
  );
}

export function DashboardPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Analitico"
        title={<GradientText>Dashboard</GradientText>}
        description="Visao geral mockada de visitas, interesses, mensagens, moedas e recomendacoes."
        breadcrumbs={["Dashboard"]}
      />
      <Section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Visitas"
          value="328"
          detail="+18% em 7 dias"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Interesses recebidos"
          value="48"
          detail="12 aguardando resposta"
          icon={<Heart className="h-5 w-5" />}
        />
        <StatCard
          label="Mensagens"
          value="214"
          detail="8 nao lidas"
          icon={<MessageCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Moedas"
          value="1.280"
          detail="320 usadas este mes"
          icon={<Coins className="h-5 w-5" />}
        />
      </Section>
      <Section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <GlassCard className="p-6">
          <h2 className="text-3xl font-semibold">Movimento da semana</h2>
          <div className="mt-6 flex h-64 items-end gap-3">
            {[38, 64, 52, 78, 92, 70, 100].map((value, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-2xl bg-gradient-to-t from-neutral-950 to-neutral-400"
                  style={{ height: `${value}%` }}
                />
                <span className="text-xs text-muted-foreground">
                  {["S", "T", "Q", "Q", "S", "S", "D"][index]}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
        <CompactList
          items={[
            {
              title: "Responder interesses",
              text: "Priorize pessoas com maior compatibilidade.",
              icon: <Heart className="h-5 w-5" />,
            },
            {
              title: "Atualizar fotos",
              text: "Perfis recentes com fotos claras convertem melhor.",
              icon: <Camera className="h-5 w-5" />,
            },
            {
              title: "Enviar presente",
              text: "Um gesto visual pode abrir uma conversa respeitosa.",
              icon: <Gift className="h-5 w-5" />,
            },
          ]}
        />
      </Section>
    </Shell>
  );
}

export function PretendentesPage() {
  const [query, setQuery] = useState("");
  const [onlyOnline, setOnlyOnline] = useState(false);
  const visible = profiles.filter((profile) => {
    const matchesQuery = `${profile.name} ${profile.city} ${profile.ministry}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesQuery && (!onlyOnline || profile.online);
  });

  return (
    <Shell>
      <PageHeader
        eyebrow="Afinidade"
        title={
          <>
            Pessoas compativeis <GradientText>com voce</GradientText>
          </>
        }
        description="Explore perfis com fotos, molduras, auras, compatibilidade e acoes simuladas."
        breadcrumbs={["Pretendentes"]}
        actions={
          <SecondaryButton
            onClick={() => toast.info("Drawer de filtros visual aberto.")}
            icon={<Filter className="h-4 w-4" />}
          >
            Filtros
          </SecondaryButton>
        }
      />
      <Section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <GlassCard className="p-5 lg:sticky lg:top-24 lg:h-fit">
          <h2 className="text-xl font-semibold">Filtros</h2>
          <div className="mt-4 grid gap-3">
            <SearchBar placeholder="Buscar nome, cidade ou ministerio" />
            <label className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-sm font-semibold shadow-sm">
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(event) => setOnlyOnline(event.target.checked)}
              />
              Apenas online
            </label>
            {["SP", "Verificadas", "Louvor", "Intercessao", "Perto de voce"].map((item) => (
              <button
                key={item}
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-left text-sm font-medium"
              >
                {item}
              </button>
            ))}
          </div>
        </GlassCard>
        <div>
          <div className="mb-5">
            <SearchBar
              placeholder="Buscar nome, cidade ou ministerio"
              value={query}
              onChange={setQuery}
            />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        </div>
      </Section>
    </Shell>
  );
}

export function PretendenteProfilePage({ id }: { id?: string }) {
  const profile = getProfile(id);
  const [interestSent, setInterestSent] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [anonymousOpen, setAnonymousOpen] = useState(false);

  return (
    <Shell>
      <section className="relative overflow-hidden border-b border-neutral-200 bg-[linear-gradient(135deg,#ffffff,#f9fafb_55%,#f3f4f6)]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs items={["Pretendentes", profile.name]} />
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-end">
            <ProfileAvatar profile={profile} size="xl" />
            <div>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((badge) => (
                  <BadgePill key={badge.label} badge={badge} />
                ))}
              </div>
              <h1 className="mt-4 text-5xl font-semibold">
                {profile.name}, {profile.age}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                {profile.city}/{profile.state} - {profile.church} - {profile.lastSeen}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton
                  onClick={() => {
                    if (profile.status === "committed") {
                      toast.info("Perfil em Proposito Firmado.");
                      return;
                    }
                    setInterestSent(true);
                    toast.success("Interesse enviado.");
                  }}
                  disabled={interestSent || profile.status === "committed"}
                  icon={<Heart className="h-4 w-4" />}
                >
                  {profile.status === "committed"
                    ? "Em Proposito"
                    : interestSent
                      ? "Interesse enviado"
                      : "Demonstrar interesse"}
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => setGiftOpen(true)}
                  icon={<Gift className="h-4 w-4" />}
                >
                  Enviar presente
                </SecondaryButton>
                <SecondaryButton
                  href={`/conversas/${profile.id}`}
                  icon={<MessageCircle className="h-4 w-4" />}
                >
                  Mensagem
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => setAnonymousOpen(true)}
                  icon={<Sparkles className="h-4 w-4" />}
                >
                  Recado anonimo
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-3xl font-semibold">Sobre</h2>
            <p className="mt-3 leading-8 text-muted-foreground">{profile.bio}</p>
          </GlassCard>
          <GlassCard className="p-6">
            <MockTabs
              tabs={[
                {
                  id: "fe",
                  label: "Fe",
                  content: (
                    <ProfileDetail
                      profile={profile}
                      fields={["church", "denomination", "ministry", "favoriteVerse"]}
                    />
                  ),
                },
                {
                  id: "busca",
                  label: "O que busca",
                  content: <p className="leading-8 text-muted-foreground">{profile.intention}</p>,
                },
                {
                  id: "valores",
                  label: "Valores",
                  content: <ChipCloud items={[...profile.faithTags, ...profile.interests]} />,
                },
              ]}
            />
          </GlassCard>
        </div>
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold">
              {profile.compatibilityPercent}% de compatibilidade
            </h2>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-950"
                style={{ width: `${profile.compatibilityPercent}%` }}
              />
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <h2 className="text-2xl font-semibold">Presentes recebidos</h2>
            <div className="mt-4 grid gap-2">
              {profile.giftsReceived.map((gift) => (
                <div
                  key={gift}
                  className="rounded-2xl border border-neutral-200 bg-white p-3 text-sm font-semibold shadow-sm"
                >
                  {gift}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </Section>
      <GiftModal open={giftOpen} onClose={() => setGiftOpen(false)} recipient={profile.name} />
      <MockModal
        open={anonymousOpen}
        onClose={() => setAnonymousOpen(false)}
        title="Enviar recado anonimo"
      >
        <textarea
          className="min-h-28 w-full rounded-2xl border border-black/10 p-3"
          placeholder="Escreva uma mensagem respeitosa..."
        />
        <div className="mt-4 flex justify-end">
          <PrimaryButton
            onClick={() => {
              toast.success("Recado anonimo enviado.");
              setAnonymousOpen(false);
            }}
          >
            Enviar recado
          </PrimaryButton>
        </div>
      </MockModal>
    </Shell>
  );
}

function ProfileDetail({ profile, fields }: { profile: MockProfile; fields: string[] }) {
  const values: Record<string, string> = {
    church: profile.church,
    denomination: profile.denomination,
    ministry: profile.ministry,
    favoriteVerse: profile.favoriteVerse,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{field}</p>
          <p className="mt-1 font-semibold">{values[field]}</p>
        </div>
      ))}
    </div>
  );
}

function ChipCloud({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-secondary px-3 py-1.5 text-sm font-semibold">
          {item}
        </span>
      ))}
    </div>
  );
}

export function PerfilPage() {
  return (
    <Shell>
      <section className="border-b border-neutral-200 bg-[linear-gradient(135deg,#ffffff,#f9fafb,#f3f4f6)]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
          <Breadcrumbs items={["Perfil"]} />
          <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <ProfileAvatar profile={profiles[0]} size="xl" />
            <div>
              <h1 className="text-5xl font-semibold">{currentUser.name}</h1>
              <p className="mt-2 text-muted-foreground">
                {currentUser.city}/{currentUser.state} - {currentUser.church} - {currentUser.role}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {currentUser.badges.map((badge) => (
                  <BadgePill key={badge.label} badge={badge} />
                ))}
              </div>
            </div>
            <StatCard
              label="Saldo"
              value={currentUser.coins}
              icon={<Coins className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>
      <Section>
        <GlassCard className="p-6">
          <MockTabs
            tabs={[
              {
                id: "dados",
                label: "Dados do Perfil",
                content: (
                  <MockForm
                    fields={["Nome", "Bio", "Cidade", "Igreja", "Versiculo favorito", "Ministerio"]}
                  />
                ),
              },
              {
                id: "preferencias",
                label: "Preferencias",
                content: (
                  <ChipCloud
                    items={[
                      "25 a 34 anos",
                      "Cristao praticante",
                      "SP e PR",
                      "Familia",
                      "Servico",
                      "Comunhao",
                    ]}
                  />
                ),
              },
              {
                id: "custom",
                label: "Personalizacao",
                content: <ItemGrid items={allStoreItems.slice(0, 6)} />,
              },
              { id: "presentes", label: "Presentes Recebidos", content: <GiftGrid /> },
              { id: "saldo", label: "Saldo/Moedas", content: <TransactionList /> },
              { id: "missoes", label: "Missoes", content: <MissionGrid /> },
            ]}
          />
        </GlassCard>
      </Section>
    </Shell>
  );
}

function MockForm({ fields }: { fields: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field} className="grid gap-2 text-sm font-semibold">
          {field}
          <input
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none focus:border-neutral-950"
            placeholder={field}
          />
        </label>
      ))}
      <div className="sm:col-span-2">
        <PrimaryButton onClick={() => toast.success("Perfil atualizado visualmente.")}>
          Salvar alteracoes
        </PrimaryButton>
      </div>
    </div>
  );
}

function ItemGrid({ items }: { items: typeof allStoreItems }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <StoreItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function GiftGrid() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gifts.slice(0, 6).map((gift) => (
          <GiftCard key={gift.id} gift={gift} onSend={() => setOpen(true)} />
        ))}
      </div>
      <GiftModal open={open} onClose={() => setOpen(false)} recipient="Ana Clara" />
    </>
  );
}

function TransactionList() {
  return (
    <div className="grid gap-3">
      {[
        "Compra Moldura Alianca de Ouro",
        "Presente enviado",
        "Missao diaria concluida",
        "Pacote de moedas",
      ].map((item, index) => (
        <div
          key={item}
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <span className="font-medium">{item}</span>
          <span className={index === 2 ? "text-emerald-700" : "text-neutral-900"}>
            {index === 2 ? "+80" : index === 3 ? "+600" : "-120"}
          </span>
        </div>
      ))}
    </div>
  );
}

function MissionGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {["Ler devocional", "Enviar mensagem", "Orar por alguem"].map((item) => (
        <GlassCard key={item} className="p-5">
          <Trophy className="h-5 w-5 text-neutral-900" />
          <p className="mt-4 font-semibold">{item}</p>
          <p className="mt-2 text-sm text-muted-foreground">Recompensa visual: 40 moedas.</p>
        </GlassCard>
      ))}
    </div>
  );
}

export function LojaPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Economia visual"
        title={<GradientText>Personalize seu perfil</GradientText>}
        description="Compre, equipe e visualize fundos, molduras, auras e stickers com estado local."
        breadcrumbs={["Loja"]}
        actions={
          <StatCard label="Saldo" value={currentUser.coins} icon={<Coins className="h-5 w-5" />} />
        }
      />
      <Section>
        <GlassCard className="p-6">
          <MockTabs
            tabs={[
              { id: "fundos", label: "Fundos", content: <ItemGrid items={storeItems} /> },
              { id: "molduras", label: "Molduras", content: <ItemGrid items={frameItems} /> },
              { id: "auras", label: "Auras", content: <ItemGrid items={auraItems} /> },
              { id: "stickers", label: "Stickers", content: <ItemGrid items={stickerItems} /> },
              {
                id: "pacotes",
                label: "Pacotes",
                content: <ItemGrid items={allStoreItems.slice(0, 3)} />,
              },
            ]}
          />
        </GlassCard>
      </Section>
    </Shell>
  );
}

export function PresentesPage() {
  const [open, setOpen] = useState(false);
  return (
    <Shell>
      <PageHeader
        eyebrow="Presentes virtuais"
        title={<GradientText>Gestos com proposito</GradientText>}
        description="Escolha presentes, destinatario e mensagem opcional, tudo com interacao local."
        breadcrumbs={["Presentes"]}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {gifts.map((gift) => (
            <GiftCard key={gift.id} gift={gift} onSend={() => setOpen(true)} />
          ))}
        </div>
      </Section>
      <GiftModal open={open} onClose={() => setOpen(false)} recipient="Ana Clara" />
    </Shell>
  );
}

export function MatchesPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Conexoes"
        title="Matches"
        description="Pessoas com interesse mutuo, conversa ativa e sinais de proposito."
        breadcrumbs={["Matches"]}
      />
      <Section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {profiles.slice(0, 6).map((profile) => (
          <GlassCard key={profile.id} className="p-5">
            <div className="flex items-center gap-4">
              <ProfileAvatar profile={profile} size="md" />
              <div>
                <h2 className="text-xl font-semibold">{profile.name}</h2>
                <p className="text-sm text-muted-foreground">{profile.lastSeen}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <PrimaryButton
                href={`/conversas/${profile.id}`}
                icon={<MessageCircle className="h-4 w-4" />}
              >
                Conversar
              </PrimaryButton>
              <SecondaryButton href={`/pretendentes/${profile.id}`}>Perfil</SecondaryButton>
            </div>
          </GlassCard>
        ))}
      </Section>
    </Shell>
  );
}

export function InteressesPage() {
  const [accepted, setAccepted] = useState<string[]>([]);
  const cards = profiles.slice(0, 5);
  return (
    <Shell>
      <PageHeader
        eyebrow="Interesses"
        title="Recebidos, enviados e aceitos"
        description="Tabs com acoes locais para aceitar, recusar ou abrir perfil."
        breadcrumbs={["Interesses"]}
      />
      <Section>
        <GlassCard className="p-6">
          <MockTabs
            tabs={[
              {
                id: "recebidos",
                label: "Recebidos",
                content: (
                  <InterestCards cards={cards} accepted={accepted} setAccepted={setAccepted} />
                ),
              },
              {
                id: "enviados",
                label: "Enviados",
                content: (
                  <InterestCards
                    cards={cards.slice(2)}
                    accepted={accepted}
                    setAccepted={setAccepted}
                  />
                ),
              },
              {
                id: "aceitos",
                label: "Aceitos",
                content: (
                  <InterestCards
                    cards={cards.filter((card) => accepted.includes(card.id))}
                    accepted={accepted}
                    setAccepted={setAccepted}
                  />
                ),
              },
              {
                id: "recusados",
                label: "Recusados",
                content: (
                  <p className="text-muted-foreground">
                    Nenhum interesse recusado nesta visualizacao.
                  </p>
                ),
              },
            ]}
          />
        </GlassCard>
      </Section>
    </Shell>
  );
}

function InterestCards({
  cards,
  accepted,
  setAccepted,
}: {
  cards: MockProfile[];
  accepted: string[];
  setAccepted: (items: string[]) => void;
}) {
  if (!cards.length) return <p className="text-muted-foreground">Nenhum item nesta aba.</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((profile) => (
        <div
          key={profile.id}
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <ProfileAvatar profile={profile} size="md" />
            <div>
              <h3 className="font-semibold">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">Mensagem curta com intencao clara.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton
              onClick={() => setAccepted([...accepted, profile.id])}
              icon={<Check className="h-4 w-4" />}
            >
              Aceitar
            </PrimaryButton>
            <SecondaryButton href={`/pretendentes/${profile.id}`}>Ver perfil</SecondaryButton>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversasPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Mensagens"
        title="Conversas"
        description="Lista de chats com busca, nao lidas e preview de ultima mensagem."
        breadcrumbs={["Conversas"]}
      />
      <Section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <GlassCard className="p-4">
          <SearchBar placeholder="Buscar conversa" />
          <div className="mt-4 grid gap-2">
            {conversations.map((conversation) => (
              <a
                key={conversation.id}
                href={`/conversas/${conversation.id}`}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:bg-neutral-100"
              >
                <ProfileAvatar profile={conversation.person} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{conversation.person.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{conversation.last}</p>
                </div>
                {conversation.unread ? (
                  <span className="rounded-full bg-neutral-950 px-2 py-1 text-xs font-semibold text-white">
                    {conversation.unread}
                  </span>
                ) : null}
              </a>
            ))}
          </div>
        </GlassCard>
        <ChatMock messages={conversations[0].messages} personName={conversations[0].person.name} />
      </Section>
    </Shell>
  );
}

export function ConversaDetailPage({ id }: { id?: string }) {
  const conversation = getConversation(id);
  return (
    <Shell>
      <PageHeader
        eyebrow="Chat"
        title={`Conversa com ${conversation.person.name}`}
        description="Bolhas modernas, campo de mensagem, sticker visual e aviso de proposito."
        breadcrumbs={["Conversas", conversation.person.name]}
      />
      <Section>
        <ChatMock messages={conversation.messages} personName={conversation.person.name} />
      </Section>
    </Shell>
  );
}

export function ComunidadePage() {
  const [posts, setPosts] = useState(communityPosts);
  const [draft, setDraft] = useState("");
  return (
    <Shell>
      <PageHeader
        eyebrow="Feed"
        title="Comunidade viva"
        description="Mural com posts, reacoes, comentarios, membros online e regras visuais."
        breadcrumbs={["Comunidade"]}
      />
      <Section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <GlassCard className="p-5">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-24 w-full rounded-2xl border border-black/10 p-3"
              placeholder="Compartilhe algo com a comunidade..."
            />
            <div className="mt-3 flex justify-end">
              <PrimaryButton
                onClick={() => {
                  if (!draft.trim()) return;
                  setPosts([
                    {
                      id: `new-${Date.now()}`,
                      author: currentUser.name,
                      title: "Novo post",
                      text: draft,
                      reactions: 0,
                      comments: 0,
                    },
                    ...posts,
                  ]);
                  setDraft("");
                }}
              >
                Publicar
              </PrimaryButton>
            </div>
          </GlassCard>
          {posts.map((post) => (
            <GlassCard key={post.id} className="p-5">
              <p className="text-sm font-semibold text-neutral-900">{post.author}</p>
              <h2 className="mt-2 text-2xl font-semibold">{post.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{post.text}</p>
              <div className="mt-4 flex gap-3 text-sm text-muted-foreground">
                <span>{post.reactions} reacoes</span>
                <span>{post.comments} comentarios</span>
              </div>
            </GlassCard>
          ))}
        </div>
        <GlassCard className="p-5">
          <h2 className="text-2xl font-semibold">Membros online</h2>
          <div className="mt-4 grid gap-3">
            {profiles
              .filter((profile) => profile.online)
              .map((profile) => (
                <div key={profile.id} className="flex items-center gap-3">
                  <ProfileAvatar profile={profile} size="sm" />
                  <span className="font-medium">{profile.name}</span>
                </div>
              ))}
          </div>
        </GlassCard>
      </Section>
    </Shell>
  );
}

export function OracoesPage() {
  const [items, setItems] = useState(prayers);
  return (
    <Shell>
      <PageHeader
        eyebrow="Oracao"
        title="Pedidos de oracao"
        description="Cards emocionais com categorias, contador e acao local Estou orando."
        breadcrumbs={["Oracoes"]}
      />
      <Section className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <GlassCard key={item.id} className="p-5">
            <p className="text-sm font-semibold text-neutral-900">{item.category}</p>
            <h2 className="mt-2 text-xl font-semibold">{item.name}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{item.text}</p>
            <button
              onClick={() =>
                setItems((prev) =>
                  prev.map((row) => (row.id === item.id ? { ...row, count: row.count + 1 } : row)),
                )
              }
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900"
            >
              <HeartHandshake className="h-4 w-4" />
              Estou orando ({item.count})
            </button>
          </GlassCard>
        ))}
      </Section>
    </Shell>
  );
}

export function DevocionalPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Devocional"
        title={<GradientText>{devotionals[0].title}</GradientText>}
        description="Devocional do dia com versiculo, reflexao, acao de salvar e lista anterior."
        breadcrumbs={["Devocional"]}
      />
      <Section className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <GlassCard className="p-6">
          <p className="text-lg font-semibold text-neutral-900">{devotionals[0].verse}</p>
          <p className="mt-5 text-xl leading-9 text-foreground/84">{devotionals[0].text}</p>
          <div className="mt-6 flex gap-3">
            <PrimaryButton
              onClick={() => toast.success("Devocional salvo.")}
              icon={<BookHeart className="h-4 w-4" />}
            >
              Salvar
            </PrimaryButton>
            <SecondaryButton onClick={() => toast.info("Compartilhamento visual aberto.")}>
              Compartilhar
            </SecondaryButton>
          </div>
        </GlassCard>
        <div className="grid gap-4">
          {devotionals.map((item) => (
            <GlassCard key={item.title} className="p-5">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.verse}</p>
            </GlassCard>
          ))}
        </div>
      </Section>
    </Shell>
  );
}

export function NoticiasPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Comunicados"
        title="Noticias da comunidade"
        description="Cards de noticias, categorias e destaque principal."
        breadcrumbs={["Noticias"]}
      />
      <Section className="grid gap-5 md:grid-cols-3">
        {news.map((item, index) => (
          <GlassCard key={item.id} className={`p-5 ${index === 0 ? "md:col-span-2" : ""}`}>
            <p className="text-sm font-semibold text-neutral-900">
              {item.category} - {item.date}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{item.text}</p>
          </GlassCard>
        ))}
      </Section>
    </Shell>
  );
}

export function RecadosPage() {
  const [open, setOpen] = useState(false);
  return (
    <Shell>
      <PageHeader
        eyebrow="Recados anonimos"
        title="Mensagens com misterio e cuidado"
        description="Inbox visual com status, revelacao, resposta e extras."
        breadcrumbs={["Recados"]}
        actions={
          <PrimaryButton onClick={() => setOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Novo recado
          </PrimaryButton>
        }
      />
      <Section className="grid gap-4 md:grid-cols-3">
        {["Pendente", "Dica enviada", "Revelacao solicitada"].map((status, index) => (
          <GlassCard key={status} className="p-5">
            <p className="text-sm font-semibold text-neutral-900">{status}</p>
            <h2 className="mt-3 text-xl font-semibold">Alguem admirou seu perfil</h2>
            <p className="mt-3 text-muted-foreground">
              Mensagem respeitosa com intencao clara e opcao de revelar visualmente.
            </p>
            <PrimaryButton onClick={() => setOpen(true)}>
              {index === 0 ? "Responder" : "Revelar"}
            </PrimaryButton>
          </GlassCard>
        ))}
      </Section>
      <MockModal open={open} onClose={() => setOpen(false)} title="Recado anonimo">
        <p className="leading-7 text-muted-foreground">
          Simulacao de recado, resposta e revelacao com estado local.
        </p>
        <div className="mt-4 flex justify-end">
          <PrimaryButton
            onClick={() => {
              toast.success("Recado atualizado.");
              setOpen(false);
            }}
          >
            Confirmar
          </PrimaryButton>
        </div>
      </MockModal>
    </Shell>
  );
}

export function VerificacaoPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Seguranca"
        title="Verificacao de perfil"
        description="Passo a passo visual com upload simulado, status e badge de verificado."
        breadcrumbs={["Verificacao"]}
      />
      <Section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <GlassCard className="p-6">
          <h2 className="text-3xl font-semibold">Aguardando analise</h2>
          <div className="mt-6 grid gap-4">
            {[
              "Enviar foto clara",
              "Confirmar documento visual",
              "Aguardar moderacao",
              "Receber badge",
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 font-semibold text-neutral-900">
                  {index + 1}
                </span>
                <span className="font-medium">{step}</span>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <Camera className="h-8 w-8 text-neutral-900" />
          <p className="mt-4 text-xl font-semibold">Upload visual</p>
          <button
            onClick={() => toast.success("Foto anexada visualmente.")}
            className="mt-4 w-full rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
          >
            Selecionar foto
          </button>
        </GlassCard>
      </Section>
    </Shell>
  );
}

export function BloqueadosPage() {
  const [blocked, setBlocked] = useState(profiles.slice(3, 5));
  return (
    <Shell>
      <PageHeader
        eyebrow="Privacidade"
        title="Bloqueados"
        description="Lista visual de usuarios bloqueados com desbloqueio local."
        breadcrumbs={["Bloqueados"]}
      />
      <Section className="grid gap-4 md:grid-cols-2">
        {blocked.length ? (
          blocked.map((profile) => (
            <GlassCard key={profile.id} className="flex items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                <ProfileAvatar profile={profile} size="md" />
                <span className="font-semibold">{profile.name}</span>
              </div>
              <SecondaryButton
                onClick={() => setBlocked((prev) => prev.filter((item) => item.id !== profile.id))}
              >
                Desbloquear
              </SecondaryButton>
            </GlassCard>
          ))
        ) : (
          <GlassCard className="p-6">
            <p>Nenhum usuario bloqueado.</p>
          </GlassCard>
        )}
      </Section>
    </Shell>
  );
}

export function ContaPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Preferencias"
        title="Minha conta"
        description="Notificacoes, tema, privacidade, seguranca e zona de perigo visual."
        breadcrumbs={["Conta"]}
      />
      <Section>
        <GlassCard className="p-6">
          <MockTabs
            tabs={[
              {
                id: "prefs",
                label: "Preferencias",
                content: (
                  <SettingsGrid
                    items={[
                      "Receber novidades",
                      "Mostrar status online",
                      "Permitir recados anonimos",
                      "Modo compacto",
                    ]}
                  />
                ),
              },
              {
                id: "privacidade",
                label: "Privacidade",
                content: (
                  <SettingsGrid
                    items={[
                      "Ocultar distancia",
                      "Aprovar mensagens",
                      "Filtrar recados",
                      "Perfil publico",
                    ]}
                  />
                ),
              },
              {
                id: "seguranca",
                label: "Seguranca",
                content: (
                  <SettingsGrid
                    items={["Verificacao ativa", "Alertas de login", "Bloqueios", "Historico"]}
                  />
                ),
              },
              {
                id: "perigo",
                label: "Zona de perigo",
                content: (
                  <GlassCard className="p-5">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <p className="mt-3 font-semibold">
                      Acoes destrutivas sao apenas visuais neste prototipo.
                    </p>
                  </GlassCard>
                ),
              },
            ]}
          />
        </GlassCard>
      </Section>
    </Shell>
  );
}

function SettingsGrid({ items }: { items: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <label
          key={item}
          className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 font-medium shadow-sm"
        >
          {item}
          <input type="checkbox" defaultChecked />
        </label>
      ))}
    </div>
  );
}

export function PropositoPage({ id }: { id?: string }) {
  const profile = getProfile(id);
  return (
    <Shell>
      <section className="border-b border-neutral-200 bg-[linear-gradient(135deg,#ffffff,#f9fafb,#f3f4f6)]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <Breadcrumbs items={["Proposito Firmado", profile.name]} />
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                Pagina do casal
              </p>
              <h1 className="mt-3 text-5xl font-semibold">
                <GradientText>Proposito Firmado</GradientText>
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                Antonio e {profile.name.split(" ")[0]} caminham ha 17 dias com versiculo, memoria,
                presentes e capsula do tempo.
              </p>
            </div>
            <div className="flex items-center">
              <ProfileAvatar profile={profiles[0]} size="xl" />
              <HeartHandshake className="mx-4 h-8 w-8 text-neutral-900" />
              <ProfileAvatar profile={profile} size="xl" />
            </div>
          </div>
        </div>
      </section>
      <Section className="grid gap-6 lg:grid-cols-3">
        <StatCard
          label="Dias em proposito"
          value="17"
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard label="Memorias" value="8" icon={<Sparkles className="h-5 w-5" />} />
        <StatCard label="Presentes do casal" value="12" icon={<Gift className="h-5 w-5" />} />
      </Section>
      <Section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <GlassCard className="p-6">
          <h2 className="text-3xl font-semibold">Timeline</h2>
          <div className="mt-5 grid gap-3">
            {[
              "Primeira conversa",
              "Primeira oracao juntos",
              "Capsula criada",
              "Presente recebido",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-neutral-200 bg-white p-4 font-semibold shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="text-3xl font-semibold">Versiculo do casal</h2>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Acima de tudo, porem, revistam-se do amor, que e o elo perfeito.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <PrimaryButton onClick={() => toast.success("Memoria adicionada.")}>
              Adicionar memoria
            </PrimaryButton>
            <SecondaryButton onClick={() => toast.info("Capsula aberta visualmente.")}>
              Abrir capsula
            </SecondaryButton>
          </div>
        </GlassCard>
      </Section>
    </Shell>
  );
}

export function SuportePage() {
  const [items, setItems] = useState(tickets);
  return (
    <Shell>
      <PageHeader
        eyebrow="Atendimento"
        title="Central de suporte"
        description="Tickets mockados, categorias, prioridade e criacao visual."
        breadcrumbs={["Suporte"]}
        actions={
          <PrimaryButton
            onClick={() =>
              setItems([
                {
                  id: "VDN-2099",
                  title: "Novo ticket visual",
                  status: "Aberto",
                  priority: "Media",
                  last: "agora",
                },
                ...items,
              ])
            }
            icon={<Plus className="h-4 w-4" />}
          >
            Criar ticket
          </PrimaryButton>
        }
      />
      <Section className="grid gap-4 md:grid-cols-3">
        {items.map((ticket) => (
          <GlassCard key={ticket.id} className="p-5">
            <Ticket className="h-5 w-5 text-neutral-900" />
            <h2 className="mt-3 text-xl font-semibold">{ticket.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {ticket.id} - {ticket.status} - {ticket.priority}
            </p>
            <SecondaryButton href={`/suporte/${ticket.id}`}>Abrir</SecondaryButton>
          </GlassCard>
        ))}
      </Section>
    </Shell>
  );
}

export function AjudaPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="FAQ"
        title="Central de ajuda"
        description="Busca, categorias e acordeoes visuais."
        breadcrumbs={["Suporte", "Ajuda"]}
      />
      <Section>
        <SearchBar placeholder="Buscar ajuda" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            "Como completar meu perfil?",
            "Como funciona a verificacao?",
            "Como enviar presente?",
            "Como denunciar algo?",
          ].map((question) => (
            <GlassCard key={question} className="p-5">
              <h2 className="text-xl font-semibold">{question}</h2>
              <p className="mt-2 text-muted-foreground">
                Resposta objetiva, respeitosa e visual para o prototipo.
              </p>
            </GlassCard>
          ))}
        </div>
      </Section>
    </Shell>
  );
}

export function TicketPage({ id }: { id?: string }) {
  return (
    <Shell>
      <PageHeader
        eyebrow="Ticket"
        title={`Atendimento ${id ?? "VDN-2041"}`}
        description="Conversa mockada entre usuario e equipe de suporte."
        breadcrumbs={["Suporte", id ?? "VDN-2041"]}
      />
      <Section>
        <ChatMock
          personName="Equipe de suporte"
          messages={[
            { from: "me", text: "Tenho uma duvida sobre minha verificacao.", time: "10:12" },
            {
              from: "them",
              text: "Estamos analisando. Sua foto esta clara e dentro dos criterios.",
              time: "10:18",
            },
          ]}
        />
      </Section>
    </Shell>
  );
}

export function AdminHomePage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Admin"
        title={<GradientText>Painel Administrativo</GradientText>}
        description="Visao robusta e publica para o mock, com estatisticas, tabelas e acoes simuladas."
        breadcrumbs={["Admin"]}
      />
      <AdminFrame title="Visao geral">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {adminStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              detail={stat.trend}
              icon={<CircleDollarSign className="h-5 w-5" />}
            />
          ))}
        </div>
        <div className="mt-6">
          <DataTable rows={adminRows} />
        </div>
      </AdminFrame>
    </Shell>
  );
}

export function AdminCatalogPage({ title, kind }: { title: string; kind: string }) {
  const rows = allStoreItems.slice(0, 8).map((item) => ({
    nome: item.name,
    preco: `${item.price}`,
    raridade: item.rarity,
    ativo: "sim",
    ordem: `${Math.floor(Math.random() * 20) + 1}`,
  }));
  const [open, setOpen] = useState(false);

  return (
    <Shell>
      <PageHeader
        eyebrow="Admin"
        title={title}
        description={`Gestao visual de ${kind} com tabela, preview, filtros e modal.`}
        breadcrumbs={["Admin", title]}
        actions={
          <PrimaryButton onClick={() => setOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Criar item
          </PrimaryButton>
        }
      />
      <AdminFrame title={title}>
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <SearchBar placeholder={`Buscar ${kind}`} />
          <SecondaryButton
            onClick={() => toast.info("Filtro visual aplicado.")}
            icon={<Filter className="h-4 w-4" />}
          >
            Filtrar
          </SecondaryButton>
          <SecondaryButton
            onClick={() => toast.success("Ordem simulada salva.")}
            icon={<ArrowRight className="h-4 w-4" />}
          >
            Salvar ordem
          </SecondaryButton>
        </div>
        <DataTable rows={rows} />
      </AdminFrame>
      <MockModal open={open} onClose={() => setOpen(false)} title={`Criar ${kind}`}>
        <MockForm fields={["Nome", "Preco", "Raridade", "Categoria"]} />
      </MockModal>
    </Shell>
  );
}

export function AdminVerificationPage({ title, kind }: { title: string; kind: string }) {
  const [rows, setRows] = useState(adminRows);
  return (
    <Shell>
      <PageHeader
        eyebrow="Admin"
        title={title}
        description={`Fila visual de ${kind} com score, status e acoes.`}
        breadcrumbs={["Admin", title]}
      />
      <AdminFrame title={title}>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <GlassCard key={row.name} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{row.type}</p>
                  <h2 className="text-2xl font-semibold">{row.name}</h2>
                  <p className="mt-2 text-muted-foreground">
                    Score mockado: {row.risk === "Baixo" ? "94" : "72"}%
                  </p>
                </div>
                <ShieldCheck className="h-6 w-6 text-neutral-900" />
              </div>
              <div className="mt-5 flex gap-2">
                <PrimaryButton
                  onClick={() =>
                    setRows((prev) =>
                      prev.map((item) =>
                        item.name === row.name ? { ...item, status: "Aprovado" } : item,
                      ),
                    )
                  }
                >
                  Aprovar
                </PrimaryButton>
                <SecondaryButton onClick={() => toast.info("Motivo de reprova aberto.")}>
                  Reprovar
                </SecondaryButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </AdminFrame>
    </Shell>
  );
}

export function AdminTeamPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Admin"
        title="Equipe da live"
        description="Cards de membros, categorias, destaque mensal e modal visual."
        breadcrumbs={["Admin", "Equipe live"]}
      />
      <AdminFrame title="Equipe live">
        <div className="grid gap-4 md:grid-cols-3">
          {profiles.slice(0, 6).map((profile, index) => (
            <GlassCard key={profile.id} className="p-5">
              <ProfileAvatar profile={profile} size="lg" />
              <h2 className="mt-4 text-xl font-semibold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">
                {["Apresentacao", "Moderacao", "Intercessao"][index % 3]}
              </p>
              <SecondaryButton onClick={() => toast.success("Membro editado visualmente.")}>
                Editar
              </SecondaryButton>
            </GlassCard>
          ))}
        </div>
      </AdminFrame>
    </Shell>
  );
}

export function BlogPage() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Blog"
        title="Relacionamento, fe e maturidade"
        description="Conteudo mockado sobre vida crista, namoro com proposito e comunidade."
        breadcrumbs={["Blog"]}
      />
      <Section className="grid gap-5 md:grid-cols-3">
        {[
          "Como iniciar uma conversa com contexto",
          "Sinais de maturidade emocional",
          "Esperar com sabedoria nao e passividade",
        ].map((title, index) => (
          <GlassCard key={title} className="p-5">
            <p className="text-sm font-semibold text-neutral-900">Artigo {index + 1}</p>
            <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
            <p className="mt-3 text-muted-foreground">
              Reflexao pratica para quem deseja viver uma jornada afetiva com fe, clareza e
              responsabilidade.
            </p>
            <SecondaryButton href={`/blog/post-${index + 1}`}>Ler</SecondaryButton>
          </GlassCard>
        ))}
      </Section>
    </Shell>
  );
}

export function BlogPostPage({ slug }: { slug?: string }) {
  return (
    <Shell>
      <PageHeader
        eyebrow="Artigo"
        title="Como iniciar uma conversa com contexto"
        description={`Post mockado: ${slug ?? "post"}`}
        breadcrumbs={["Blog", "Post"]}
      />
      <Section>
        <GlassCard className="mx-auto max-w-3xl p-6 sm:p-8">
          <p className="text-lg leading-9 text-foreground/84">
            Uma conversa com proposito nao precisa comecar pesada. Ela precisa ser honesta. Pergunte
            sobre rotina, fe, familia, servico e sonhos, sem transformar o outro em entrevista. O
            cuidado aparece no tom, no tempo e na escuta.
          </p>
        </GlassCard>
      </Section>
    </Shell>
  );
}

export function StaticInfoPage({
  kind,
}: {
  kind: "como" | "sobre" | "depoimentos" | "termos" | "manual";
}) {
  const copy = {
    como: [
      "Como funciona",
      "Do perfil a conversa, cada etapa favorece clareza, seguranca e respeito.",
    ],
    sobre: [
      "Sobre o VaiDarNamoro",
      "Uma comunidade crista para visualizar conexoes com proposito e cuidado.",
    ],
    depoimentos: [
      "Depoimentos",
      "Historias mockadas de pessoas que encontraram conversas maduras e amizades reais.",
    ],
    termos: [
      "Termos e diretrizes",
      "Regras visuais de respeito, privacidade, conduta e seguranca comunitaria.",
    ],
    manual: [
      "Manual da plataforma",
      "Guia de uso para perfil, loja, presentes, comunidade, suporte e admin.",
    ],
  }[kind];
  return (
    <Shell>
      <PageHeader eyebrow="Publico" title={copy[0]} description={copy[1]} breadcrumbs={[copy[0]]} />
      <Section>
        <CompactList
          items={[
            {
              title: "Fe com maturidade",
              text: "A experiencia valoriza intencao clara e conversas respeitosas.",
              icon: <BookHeart className="h-5 w-5" />,
            },
            {
              title: "Seguranca",
              text: "Denuncia, bloqueio, verificacao e moderacao aparecem no prototipo.",
              icon: <ShieldCheck className="h-5 w-5" />,
            },
            {
              title: "Comunidade",
              text: "Live, mural, oracoes, devocionais e suporte compoem a jornada.",
              icon: <Users className="h-5 w-5" />,
            },
          ]}
        />
      </Section>
    </Shell>
  );
}
