import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import {
  Home, User, Globe, MessageCircle, Gem, Sparkles, Users, Newspaper,
  Share2, Ban, Sun, Moon, LogOut, ShieldCheck, Lightbulb, Heart, Search,
} from "lucide-react";

export const Route = createFileRoute("/manual")({
  head: () => ({
    meta: [
      { title: "Manual do Usuário — VaiDarNamoro" },
      { name: "description", content: "Guia completo de utilização da plataforma VaiDarNamoro." },
    ],
  }),
  component: ManualPage,
});

type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "ul"; items: string[] };

type SectionDef = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  blocks: Block[];
};

const SECTIONS: SectionDef[] = [
  {
    id: "boas-vindas", title: "Bem-vindo(a)", icon: Heart,
    color: "from-rose-500/15 to-pink-500/10 text-rose-600 dark:text-rose-300",
    blocks: [
      { kind: "p", text: "Esta plataforma foi criada para proporcionar conexões cristãs saudáveis, seguras e respeitosas. Aqui você poderá conhecer pessoas, criar amizades, conversar, demonstrar interesse e interagir com toda a comunidade de maneira simples e organizada." },
      { kind: "p", text: "Este manual irá explicar detalhadamente cada área do sistema e como utilizá-las corretamente." },
    ],
  },
  {
    id: "inicio", title: "Página Inicial — Dashboard", icon: Home,
    color: "from-rose-500/15 to-pink-500/10 text-rose-600 dark:text-rose-300",
    blocks: [
      { kind: "p", text: "A aba “Início” funciona como seu painel principal da plataforma. Nela você poderá acompanhar diversas informações importantes sobre seu perfil e sua movimentação dentro da comunidade." },
      { kind: "h", text: "Pessoas que visitaram seu perfil" },
      { kind: "ul", items: ["quantidade de visitas","crescimento de visualizações","movimentação recente no seu perfil"] },
      { kind: "h", text: "Estatísticas de visitantes" },
      { kind: "p", text: "O sistema mostrará informações estimadas como:" },
      { kind: "ul", items: ["cidades que mais visitam seu perfil","estados com maior interesse","faixa etária predominante","perfil de público que mais acessa você"] },
      { kind: "p", text: "Esses dados ajudam você a entender melhor quem está interagindo com seu perfil." },
      { kind: "h", text: "Novidades e avisos" },
      { kind: "ul", items: ["comunicados da plataforma","novidades","eventos","textos importantes","regras atualizadas","mensagens administrativas"] },
      { kind: "h", text: "Informações rápidas" },
      { kind: "ul", items: ["quantidade de interesses recebidos","quantidade de matches","mensagens novas","notificações recentes","streak/presença diária","evolução do pet virtual"] },
    ],
  },
  {
    id: "perfil", title: "Aba Perfil", icon: User,
    color: "from-violet-500/15 to-fuchsia-500/10 text-violet-600 dark:text-violet-300",
    blocks: [
      { kind: "p", text: "Na aba “Perfil”, você poderá editar e atualizar todas as suas informações pessoais." },
      { kind: "h", text: "Informações pessoais" },
      { kind: "ul", items: ["foto de perfil","nome","idade","altura","cidade","estado","igreja","anos de batismo","descrição pessoal"] },
      { kind: "h", text: "Preferências" },
      { kind: "ul", items: ["faixa etária desejada","localização desejada","preferências de relacionamento","características que procura","interesse em pessoas com filhos"] },
      { kind: "h", text: "Atualização constante" },
      { kind: "p", text: "Manter seu perfil atualizado aumenta:" },
      { kind: "ul", items: ["suas chances de receber interesses","a qualidade dos matches","a confiança dos outros usuários"] },
    ],
  },
  {
    id: "comunidade", title: "Aba Comunidade", icon: Globe,
    color: "from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-300",
    blocks: [
      { kind: "p", text: "A aba “Comunidade” funciona como um espaço público de interação entre todos os usuários da plataforma." },
      { kind: "h", text: "O que você pode fazer" },
      { kind: "ul", items: ["publicar mensagens","comentar","conversar publicamente","interagir com a comunidade","compartilhar opiniões respeitosas","participar das discussões"] },
      { kind: "h", text: "Como funciona" },
      { kind: "p", text: "Seu comentário aparecerá com sua foto, seu nome e horário da publicação. As mensagens são atualizadas em tempo real." },
      { kind: "h", text: "Importante" },
      { kind: "p", text: "A comunidade deve permanecer respeitosa, saudável, organizada e compatível com valores cristãos. Comentários ofensivos poderão ser removidos pela administração." },
    ],
  },
  {
    id: "conversas", title: "Aba Conversas", icon: MessageCircle,
    color: "from-sky-500/15 to-blue-500/10 text-sky-600 dark:text-sky-300",
    blocks: [
      { kind: "p", text: "Na aba “Conversas” ficam todos os seus chats privados." },
      { kind: "h", text: "Como liberar uma conversa" },
      { kind: "p", text: "A conversa privada somente é liberada quando você demonstra interesse em alguém E a outra pessoa também demonstra interesse em você. Quando isso acontece, ocorre um MATCH e o chat privado é liberado automaticamente." },
      { kind: "h", text: "Recursos das conversas" },
      { kind: "ul", items: ["enviar mensagens","visualizar mensagens recebidas","conversar em tempo real","continuar conversas antigas"] },
    ],
  },
  {
    id: "pretendentes", title: "Aba Pretendentes", icon: Gem,
    color: "from-amber-500/15 to-yellow-500/10 text-amber-600 dark:text-amber-300",
    blocks: [
      { kind: "p", text: "A aba “Pretendentes” mostra todos os perfis disponíveis na plataforma." },
      { kind: "h", text: "O que aparece nessa lista" },
      { kind: "ul", items: ["foto","nome","idade","cidade/estado","breve descrição","informações principais"] },
      { kind: "h", text: "Visualização completa" },
      { kind: "p", text: "Ao entrar no perfil de alguém, você poderá visualizar informações detalhadas, conhecer melhor a pessoa, analisar compatibilidade e demonstrar interesse." },
      { kind: "h", text: "Demonstrar interesse" },
      { kind: "p", text: "Caso goste de alguém, clique em “+ Interesse”. A pessoa receberá uma notificação informando seu interesse." },
    ],
  },
  {
    id: "interesses", title: "Aba Interesses", icon: Sparkles,
    color: "from-pink-500/15 to-rose-500/10 text-pink-600 dark:text-pink-300",
    blocks: [
      { kind: "p", text: "Nesta aba ficam organizados os interesses que você recebeu e os interesses que você enviou." },
      { kind: "h", text: "Interesses recebidos" },
      { kind: "p", text: "Aqui você verá quem demonstrou interesse em você. Você poderá ignorar OU demonstrar interesse de volta." },
      { kind: "h", text: "Interesses enviados" },
      { kind: "p", text: "Você também poderá acompanhar todas as pessoas em que demonstrou interesse." },
    ],
  },
  {
    id: "matches", title: "Aba Matches", icon: Users,
    color: "from-red-500/15 to-rose-500/10 text-red-600 dark:text-red-300",
    blocks: [
      { kind: "p", text: "A aba “Matches” reúne todas as pessoas com quem houve interesse recíproco." },
      { kind: "h", text: "O que você pode fazer" },
      { kind: "ul", items: ["iniciar conversa","continuar conversas","visualizar matches ativos","desfazer match"] },
      { kind: "h", text: "Desfazer Match" },
      { kind: "p", text: "Caso deseje, você poderá remover o match. Ao desfazer, o chat poderá ser encerrado e a conexão será removida." },
    ],
  },
  {
    id: "noticias", title: "Aba Notícias", icon: Newspaper,
    color: "from-indigo-500/15 to-blue-500/10 text-indigo-600 dark:text-indigo-300",
    blocks: [
      { kind: "p", text: "Na aba “Notícias”, você poderá acompanhar:" },
      { kind: "ul", items: ["novidades da plataforma","avisos importantes","atualizações","publicações administrativas","conteúdos especiais","textos devocionais"] },
      { kind: "h", text: "Devocionais" },
      { kind: "p", text: "Os devocionais poderão conter versículos, reflexões, mensagens bíblicas e textos diários." },
    ],
  },
  {
    id: "compartilhar", title: "Aba Compartilhar", icon: Share2,
    color: "from-cyan-500/15 to-sky-500/10 text-cyan-600 dark:text-cyan-300",
    blocks: [
      { kind: "p", text: "Nesta área você poderá compartilhar a plataforma com outras pessoas." },
      { kind: "h", text: "Como funciona" },
      { kind: "p", text: "Ao clicar, será exibido o link do site. Você poderá copiar e enviar para amigos. O compartilhamento ajuda a comunidade a crescer." },
    ],
  },
  {
    id: "bloqueados", title: "Aba Bloqueados", icon: Ban,
    color: "from-zinc-500/15 to-slate-500/10 text-zinc-600 dark:text-zinc-300",
    blocks: [
      { kind: "p", text: "Na aba “Bloqueados”, você poderá visualizar todas as pessoas bloqueadas por você." },
      { kind: "h", text: "O que é possível fazer" },
      { kind: "ul", items: ["desbloquear usuários","revisar bloqueios anteriores"] },
      { kind: "h", text: "Quando bloquear alguém" },
      { kind: "p", text: "O bloqueio é recomendado em casos de desconforto, insistência, comportamento inadequado ou desrespeito." },
    ],
  },
  {
    id: "tema", title: "Tema Claro e Tema Escuro", icon: Sun,
    color: "from-orange-500/15 to-amber-500/10 text-orange-600 dark:text-orange-300",
    blocks: [
      { kind: "p", text: "A plataforma possui modo claro e modo escuro. Você poderá alternar entre eles a qualquer momento." },
      { kind: "h", text: "Tema Claro" },
      { kind: "p", text: "Ideal para ambientes iluminados e leitura durante o dia." },
      { kind: "h", text: "Tema Escuro" },
      { kind: "p", text: "Ideal para uso noturno, conforto visual e economia de bateria em alguns dispositivos." },
    ],
  },
  {
    id: "sair", title: "Botão Sair", icon: LogOut,
    color: "from-stone-500/15 to-neutral-500/10 text-stone-600 dark:text-stone-300",
    blocks: [
      { kind: "p", text: "O botão “Sair” serve para encerrar sua sessão e deslogar da plataforma com segurança." },
      { kind: "p", text: "Recomendamos utilizar essa opção ao acessar em computadores públicos ou dispositivos compartilhados." },
    ],
  },
  {
    id: "seguranca", title: "Segurança da Conta", icon: ShieldCheck,
    color: "from-green-500/15 to-emerald-500/10 text-green-600 dark:text-green-300",
    blocks: [
      { kind: "p", text: "Para sua proteção:" },
      { kind: "ul", items: ["nunca compartilhe sua senha","utilize informações verdadeiras","denuncie comportamentos suspeitos","mantenha seu perfil atualizado"] },
    ],
  },
  {
    id: "dicas", title: "Dicas Para Melhor Experiência", icon: Lightbulb,
    color: "from-yellow-500/15 to-amber-500/10 text-yellow-600 dark:text-yellow-300",
    blocks: [
      { kind: "h", text: "Complete bem seu perfil" },
      { kind: "p", text: "Perfis completos geram mais confiança, mais visualizações e mais interesses." },
      { kind: "h", text: "Seja respeitoso" },
      { kind: "p", text: "A qualidade da comunidade depende do comportamento de todos." },
      { kind: "h", text: "Tenha paciência" },
      { kind: "p", text: "Relacionamentos saudáveis são construídos com respeito, maturidade, diálogo e honestidade." },
    ],
  },
  {
    id: "objetivo", title: "Objetivo da Plataforma", icon: Heart,
    color: "from-rose-500/15 to-red-500/10 text-rose-600 dark:text-rose-300",
    blocks: [
      { kind: "p", text: "Nosso objetivo é criar um ambiente seguro, cristão, saudável, respeitoso e acolhedor." },
      { kind: "p", text: "Desejamos que cada conexão criada aqui seja baseada em verdade, responsabilidade, princípios cristãos e boas intenções." },
      { kind: "p", text: "Seja bem-vindo(a) à comunidade." },
    ],
  },
];

function highlight(text: string, q: string) {
  if (!q) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? <mark key={i} className="rounded bg-yellow-200 px-0.5 text-yellow-950 dark:bg-yellow-400/40 dark:text-yellow-50">{p}</mark> : <span key={i}>{p}</span>
  );
}

function sectionMatches(s: SectionDef, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (s.title.toLowerCase().includes(needle)) return true;
  return s.blocks.some((b) => {
    if (b.kind === "ul") return b.items.some((it) => it.toLowerCase().includes(needle));
    return b.text.toLowerCase().includes(needle);
  });
}

function SectionCard({ section, q }: { section: SectionDef; q: string }) {
  const Icon = section.icon;
  return (
    <section id={section.id} className="scroll-mt-24">
      <div className={`rounded-2xl border border-border bg-gradient-to-br ${section.color} p-5 md:p-6 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/70 shadow">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {highlight(section.title, q)}
          </h2>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-foreground/90">
          {section.blocks.map((b, i) => {
            if (b.kind === "h") return <h3 key={i} className="mt-4 text-base font-semibold text-foreground">{highlight(b.text, q)}</h3>;
            if (b.kind === "p") return <p key={i}>{highlight(b.text, q)}</p>;
            return (
              <ul key={i} className="ml-5 list-disc space-y-1 text-foreground/80">
                {b.items.map((it, k) => <li key={k}>{highlight(it, q)}</li>)}
              </ul>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ManualPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => SECTIONS.filter((s) => sectionMatches(s, q)), [q]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="glass rounded-3xl p-6 md:p-10 shadow-elegant">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gradient">Manual de Utilização da Plataforma</h1>
          <p className="mt-3 text-foreground/80">Guia completo das áreas do sistema. Use a busca abaixo para encontrar qualquer assunto rapidamente.</p>

          {/* Busca */}
          <div className="sticky top-16 z-30 mt-6 rounded-2xl border border-border bg-background/85 p-3 backdrop-blur shadow-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar no manual… (ex.: match, foto, bloquear)"
                className="pl-9"
                aria-label="Buscar no manual"
              />
            </div>
            {q && (
              <p className="mt-2 text-xs text-muted-foreground">
                {filtered.length} resultado{filtered.length === 1 ? "" : "s"} para “{q}”.
              </p>
            )}
          </div>

          {/* Sumário */}
          {!q && (
            <nav aria-label="Sumário" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`group flex items-center gap-2 rounded-xl border border-border bg-gradient-to-br ${s.color} p-3 text-sm font-medium transition hover:scale-[1.02] hover:shadow-md`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{s.title}</span>
                  </a>
                );
              })}
            </nav>
          )}

          <div className="mt-8 space-y-6">
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                Nenhum resultado encontrado. Tente outro termo.
              </p>
            ) : (
              filtered.map((s) => <SectionCard key={s.id} section={s} q={q} />)
            )}
          </div>
        </div>
      </main>
    </div>
  );
}