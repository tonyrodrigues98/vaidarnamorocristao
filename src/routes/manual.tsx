import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/layout/Header";
import {
  Home, User, Globe, MessageCircle, Gem, Sparkles, Users, Newspaper,
  Share2, Ban, Sun, Moon, LogOut, ShieldCheck, Lightbulb, Heart,
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

type SectionDef = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; // tailwind classes for accent
};

const SECTIONS: SectionDef[] = [
  { id: "inicio", title: "Página Inicial — Dashboard", icon: Home, color: "from-rose-500/15 to-pink-500/10 text-rose-600 dark:text-rose-300" },
  { id: "perfil", title: "Aba Perfil", icon: User, color: "from-violet-500/15 to-fuchsia-500/10 text-violet-600 dark:text-violet-300" },
  { id: "comunidade", title: "Aba Comunidade", icon: Globe, color: "from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-300" },
  { id: "conversas", title: "Aba Conversas", icon: MessageCircle, color: "from-sky-500/15 to-blue-500/10 text-sky-600 dark:text-sky-300" },
  { id: "pretendentes", title: "Aba Pretendentes", icon: Gem, color: "from-amber-500/15 to-yellow-500/10 text-amber-600 dark:text-amber-300" },
  { id: "interesses", title: "Aba Interesses", icon: Sparkles, color: "from-pink-500/15 to-rose-500/10 text-pink-600 dark:text-pink-300" },
  { id: "matches", title: "Aba Matches", icon: Users, color: "from-red-500/15 to-rose-500/10 text-red-600 dark:text-red-300" },
  { id: "noticias", title: "Aba Notícias", icon: Newspaper, color: "from-indigo-500/15 to-blue-500/10 text-indigo-600 dark:text-indigo-300" },
  { id: "compartilhar", title: "Aba Compartilhar", icon: Share2, color: "from-cyan-500/15 to-sky-500/10 text-cyan-600 dark:text-cyan-300" },
  { id: "bloqueados", title: "Aba Bloqueados", icon: Ban, color: "from-zinc-500/15 to-slate-500/10 text-zinc-600 dark:text-zinc-300" },
  { id: "tema", title: "Tema Claro e Escuro", icon: Sun, color: "from-orange-500/15 to-amber-500/10 text-orange-600 dark:text-orange-300" },
  { id: "sair", title: "Botão Sair", icon: LogOut, color: "from-stone-500/15 to-neutral-500/10 text-stone-600 dark:text-stone-300" },
  { id: "seguranca", title: "Segurança da Conta", icon: ShieldCheck, color: "from-green-500/15 to-emerald-500/10 text-green-600 dark:text-green-300" },
  { id: "dicas", title: "Dicas para Melhor Experiência", icon: Lightbulb, color: "from-yellow-500/15 to-amber-500/10 text-yellow-600 dark:text-yellow-300" },
  { id: "objetivo", title: "Objetivo da Plataforma", icon: Heart, color: "from-rose-500/15 to-red-500/10 text-rose-600 dark:text-rose-300" },
];

function Card({ section, children }: { section: SectionDef; children: React.ReactNode }) {
  const Icon = section.icon;
  return (
    <section id={section.id} className="scroll-mt-24">
      <div className={`rounded-2xl border border-border bg-gradient-to-br ${section.color} p-5 md:p-6 shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/70 shadow">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{section.title}</h2>
        </div>
        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-foreground/90">{children}</div>
      </div>
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-4 text-base font-semibold text-foreground">{children}</h3>;
}
function UL({ items }: { items: string[] }) {
  return <ul className="ml-5 list-disc space-y-1 text-foreground/80">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>;
}

function ManualPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="glass rounded-3xl p-6 md:p-10 shadow-elegant">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gradient">Manual de Utilização da Plataforma</h1>
          <p className="mt-3 text-foreground/80">Esta plataforma foi criada para proporcionar conexões cristãs saudáveis, seguras e respeitosas. Aqui você encontra um guia completo de cada área do sistema.</p>

          {/* Sumário com cards */}
          <nav aria-label="Sumário" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
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

          <div className="mt-10 space-y-6">
            <Card section={SECTIONS[0]}>
              <p>A aba “Início” funciona como seu painel principal da plataforma.</p>
              <Sub>Pessoas que visitaram seu perfil</Sub>
              <UL items={["quantidade de visitas","crescimento de visualizações","movimentação recente no seu perfil"]} />
              <Sub>Estatísticas de visitantes</Sub>
              <UL items={["cidades que mais visitam seu perfil","estados com maior interesse","faixa etária predominante","perfil de público que mais acessa você"]} />
              <Sub>Novidades e avisos</Sub>
              <UL items={["comunicados da plataforma","novidades","eventos","textos importantes","regras atualizadas","mensagens administrativas"]} />
              <Sub>Informações rápidas</Sub>
              <UL items={["interesses recebidos","matches","mensagens novas","notificações recentes","streak/presença diária","evolução do pet virtual"]} />
            </Card>

            <Card section={SECTIONS[1]}>
              <p>Edite e atualize todas as suas informações pessoais.</p>
              <Sub>Informações pessoais</Sub>
              <UL items={["foto de perfil","nome","idade","altura","cidade","estado","igreja","anos de batismo","descrição pessoal"]} />
              <Sub>Preferências</Sub>
              <UL items={["faixa etária desejada","localização desejada","preferências de relacionamento","características que procura","interesse em pessoas com filhos"]} />
              <p>Manter seu perfil atualizado aumenta suas chances de receber interesses e a qualidade dos matches.</p>
            </Card>

            <Card section={SECTIONS[2]}>
              <p>Espaço público de interação entre todos os usuários da plataforma.</p>
              <Sub>O que você pode fazer</Sub>
              <UL items={["publicar mensagens","comentar","conversar publicamente","interagir com a comunidade","compartilhar opiniões respeitosas","participar das discussões"]} />
              <p>As mensagens são atualizadas em tempo real. A comunidade deve permanecer respeitosa, saudável e compatível com valores cristãos.</p>
            </Card>

            <Card section={SECTIONS[3]}>
              <p>Aqui ficam todos os seus chats privados.</p>
              <Sub>Como liberar uma conversa</Sub>
              <p>A conversa privada só é liberada quando você demonstra interesse em alguém <strong>e</strong> a outra pessoa também demonstra interesse em você. Quando isso acontece, ocorre um <strong>MATCH</strong> e o chat é liberado automaticamente.</p>
              <Sub>Recursos</Sub>
              <UL items={["enviar mensagens","visualizar mensagens recebidas","conversar em tempo real","continuar conversas antigas"]} />
            </Card>

            <Card section={SECTIONS[4]}>
              <p>Mostra todos os perfis disponíveis na plataforma.</p>
              <UL items={["foto","nome","idade","cidade/estado","breve descrição","informações principais"]} />
              <Sub>Demonstrar interesse</Sub>
              <p>Caso goste de alguém, clique em <strong>“+ Interesse”</strong>. A pessoa receberá uma notificação informando seu interesse.</p>
            </Card>

            <Card section={SECTIONS[5]}>
              <p>Aqui ficam organizados os interesses recebidos e enviados.</p>
              <Sub>Recebidos</Sub>
              <p>Veja quem demonstrou interesse em você. Você pode ignorar ou demonstrar interesse de volta.</p>
              <Sub>Enviados</Sub>
              <p>Acompanhe todas as pessoas em que você demonstrou interesse.</p>
            </Card>

            <Card section={SECTIONS[6]}>
              <p>Reúne todas as pessoas com quem houve interesse recíproco.</p>
              <UL items={["iniciar conversa","continuar conversas","visualizar matches ativos","desfazer match"]} />
              <p>Ao desfazer um match, o chat poderá ser encerrado e a conexão será removida.</p>
            </Card>

            <Card section={SECTIONS[7]}>
              <p>Acompanhe novidades, avisos e publicações administrativas.</p>
              <UL items={["novidades da plataforma","avisos importantes","atualizações","conteúdos especiais","textos devocionais"]} />
              <p>Os devocionais poderão conter versículos, reflexões, mensagens bíblicas e textos diários.</p>
            </Card>

            <Card section={SECTIONS[8]}>
              <p>Compartilhe a plataforma com outras pessoas. Ao clicar, será exibido o link do site para você copiar e enviar a amigos.</p>
            </Card>

            <Card section={SECTIONS[9]}>
              <p>Visualize e gerencie pessoas bloqueadas. Você pode desbloquear usuários e revisar bloqueios anteriores.</p>
              <p>Recomendado em casos de desconforto, insistência, comportamento inadequado ou desrespeito.</p>
            </Card>

            <Card section={SECTIONS[10]}>
              <p>Alterne entre modo claro e escuro a qualquer momento.</p>
              <Sub><Sun className="inline h-4 w-4" /> Tema Claro</Sub>
              <p>Ideal para ambientes iluminados e leitura durante o dia.</p>
              <Sub><Moon className="inline h-4 w-4" /> Tema Escuro</Sub>
              <p>Ideal para uso noturno, conforto visual e economia de bateria em alguns dispositivos.</p>
            </Card>

            <Card section={SECTIONS[11]}>
              <p>Encerra sua sessão com segurança. Recomendado em computadores públicos ou dispositivos compartilhados.</p>
            </Card>

            <Card section={SECTIONS[12]}>
              <UL items={["nunca compartilhe sua senha","utilize informações verdadeiras","denuncie comportamentos suspeitos","mantenha seu perfil atualizado"]} />
            </Card>

            <Card section={SECTIONS[13]}>
              <Sub>Complete bem seu perfil</Sub>
              <p>Perfis completos geram mais confiança, mais visualizações e mais interesses.</p>
              <Sub>Seja respeitoso</Sub>
              <p>A qualidade da comunidade depende do comportamento de todos.</p>
              <Sub>Tenha paciência</Sub>
              <p>Relacionamentos saudáveis são construídos com respeito, maturidade, diálogo e honestidade.</p>
            </Card>

            <Card section={SECTIONS[14]}>
              <p>Nosso objetivo é criar um ambiente seguro, cristão, saudável, respeitoso e acolhedor.</p>
              <p className="font-medium">Desejamos que cada conexão criada aqui seja baseada em verdade, responsabilidade, princípios cristãos e boas intenções.</p>
              <p className="text-[var(--rose)] font-semibold">Seja bem-vindo(a) à comunidade.</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}