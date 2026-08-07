import { createFileRoute } from "@tanstack/react-router";
import { DocumentShell } from "@/components/shells/DocumentShell";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos e Condições — VaiDarNamoro" },
      { name: "description", content: "Regras, diretrizes e termos da comunidade VaiDarNamoro." },
    ],
  }),
  component: TermosPage,
});

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mt-10 text-2xl font-bold text-[var(--rose)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-5 text-lg font-semibold text-foreground">{children}</h3>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="ml-5 list-disc space-y-1 text-foreground/80">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function TermosPage() {
  return (
    <DocumentShell>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="glass rounded-3xl p-6 md:p-10 shadow-elegant">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gradient">
            Regras, Diretrizes e Termos da Comunidade
          </h1>

          <div className="mt-6 rounded-2xl border border-border bg-card/60 p-5">
            <h2 className="text-xl font-bold">Bem-vindo à Plataforma</h2>
            <p className="mt-2 text-foreground/80">
              Nossa plataforma foi criada com o propósito de conectar pessoas cristãs que desejam
              construir amizades, relacionamentos sérios e, futuramente, famílias baseadas em
              princípios cristãos, respeito mútuo, honestidade e responsabilidade emocional.
            </p>
            <p className="mt-2 text-foreground/80">
              Este ambiente foi desenvolvido para ser seguro, saudável, respeitoso e alinhado com
              valores cristãos.
            </p>
            <p className="mt-2 text-foreground/80">
              Ao utilizar a plataforma, o usuário declara estar ciente e de acordo com todas as
              regras, diretrizes e políticas descritas abaixo.
            </p>
          </div>

          {/* Sumário */}
          <nav className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sumário
            </h2>
            <ol className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["s1", "1. Requisitos obrigatórios"],
                ["s2", "2. Objetivo da plataforma"],
                ["s3", "3. Conduta dos usuários"],
                ["s4", "4. Proibições absolutas"],
                ["s5", "5. Aprovação de perfis"],
                ["s6", "6. Regras das fotos"],
                ["s7", "7. Interesse e conversas"],
                ["s8", "8. Comunidade pública"],
                ["s9", "9. Segurança e privacidade"],
                ["s10", "10. Denúncias"],
                ["s11", "11. Penalidades"],
                ["s12", "12. Cancelamento"],
                ["s13", "13. Atualizações"],
                ["s14", "14. Compromisso"],
              ].map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-[var(--rose)] hover:underline">
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Section id="s1" title="1. Requisitos Obrigatórios para Utilização">
            <SubTitle>1.1 Ser maior de 18 anos</SubTitle>
            <p>
              Esta plataforma é exclusivamente destinada a adultos. Ao criar uma conta, o usuário
              declara possuir:
            </p>
            <List
              items={[
                "18 anos completos ou mais",
                "capacidade civil para utilização da plataforma",
                "responsabilidade legal sobre as informações fornecidas",
              ]}
            />
            <p>
              Perfis suspeitos de menoridade poderão ser bloqueados, removidos ou solicitados a
              enviar comprovação.
            </p>

            <SubTitle>1.2 Ser cristão praticante</SubTitle>
            <p>Entende-se como cristão praticante:</p>
            <List
              items={[
                "pessoa que possui fé cristã",
                "frequenta igreja regularmente",
                "busca viver princípios cristãos",
                "respeita valores bíblicos",
                "deseja construir relacionamentos alinhados à fé",
              ]}
            />
            <p>
              Não é obrigatório pertencer a uma denominação específica, porém respeito à fé cristã é
              obrigatório. Ataques religiosos, zombarias ou desrespeito à fé não serão tolerados.
            </p>

            <SubTitle>1.3 Ser solteiro(a), divorciado(a) ou viúvo(a)</SubTitle>
            <p>
              Não é permitido pessoas casadas, em união estável ativa, em relacionamentos ocultos,
              ou perfis criados para traição/infidelidade. Caso identificado, o perfil será removido
              imediatamente e a conta poderá ser banida permanentemente.
            </p>
          </Section>

          <Section id="s2" title="2. Objetivo da Plataforma">
            <p>
              A plataforma existe para promover conexões saudáveis, incentivar relacionamentos
              sérios, criar amizades cristãs, desenvolver comunhão, fortalecer valores familiares e
              proporcionar um ambiente respeitoso.
            </p>
            <p>
              <strong>
                Esta NÃO é uma plataforma adulta, casual, vulgar ou focada em encontros
                superficiais.
              </strong>{" "}
              Nosso objetivo principal é qualidade humana e espiritual.
            </p>
          </Section>

          <Section id="s3" title="3. Conduta Obrigatória dos Usuários">
            <p>
              Todo usuário deve agir com respeito, educação, honestidade, empatia, maturidade e
              responsabilidade emocional, em comportamento compatível com um ambiente cristão
              saudável.
            </p>
          </Section>

          <Section id="s4" title="4. Proibições Absolutas">
            <SubTitle>4.1 Conteúdo sexual ou impróprio</SubTitle>
            <List
              items={[
                "envio de nudez",
                "conteúdo sexual",
                "mensagens obscenas",
                "cantadas ofensivas",
                "assédio",
                "insinuações explícitas",
                "pedidos íntimos",
              ]}
            />
            <p>Qualquer violação poderá gerar suspensão imediata ou banimento permanente.</p>

            <SubTitle>4.2 Linguagem ofensiva</SubTitle>
            <List
              items={[
                "xingamentos",
                "humilhações",
                "ameaças",
                "discriminação",
                "preconceito",
                "perseguição",
                "comportamento agressivo",
                "racismo, intolerância religiosa, misoginia, ataques pessoais",
              ]}
            />

            <SubTitle>4.3 Perfis falsos</SubTitle>
            <List
              items={[
                "fotos falsas",
                "fingir identidade",
                "múltiplas contas",
                "informações enganosas",
                "manipulação emocional",
              ]}
            />
            <p>A plataforma poderá solicitar confirmação de identidade em casos suspeitos.</p>

            <SubTitle>4.4 Uso comercial indevido</SubTitle>
            <List
              items={[
                "spam",
                "propaganda",
                "vendas não autorizadas",
                "divulgação de serviços",
                "marketing agressivo",
                "pirâmides financeiras",
                "captação indevida de clientes",
              ]}
            />

            <SubTitle>4.5 Atividades ilegais</SubTitle>
            <p>
              Resultam em banimento imediato e possível comunicação às autoridades. Inclui golpes,
              extorsão, ameaças, fraudes, vazamento de dados e perseguição.
            </p>
          </Section>

          <Section id="s5" title="5. Aprovação de Perfis">
            <p>
              Todos os perfis passam por análise administrativa. A equipe poderá aprovar, reprovar,
              solicitar alterações, suspender ou remover contas. Perfis poderão ser recusados caso
              estejam incompletos, contenham informações suspeitas, possuam comportamento inadequado
              ou utilizem imagens impróprias.
            </p>
          </Section>

          <Section id="s6" title="6. Regras das Fotos">
            <p>As fotos devem ser reais, recentes, nítidas e respeitosas.</p>
            <p>
              <strong>Não serão permitidas:</strong>
            </p>
            <List
              items={[
                "fotos íntimas",
                "fotos provocativas",
                "imagens violentas",
                "imagens ofensivas",
                "fotos de terceiros",
                "imagens com excesso de edição enganosa",
              ]}
            />
          </Section>

          <Section id="s7" title="7. Sistema de Interesse e Conversas">
            <p>
              O sistema de interesse existe para permitir conexões mútuas, evitar abordagens
              invasivas e gerar interações respeitosas. O chat privado somente será liberado quando
              houver interesse recíproco. Mesmo no chat privado, as regras continuam válidas e
              comportamento abusivo será punido.
            </p>
          </Section>

          <Section id="s8" title="8. Comunidade Pública">
            <p>
              A aba “Comunidade” existe para interação saudável, comunhão, troca de experiências e
              conversas respeitosas.
            </p>
            <p>
              <strong>Não serão permitidos:</strong>
            </p>
            <List
              items={[
                "discussões agressivas",
                "brigas religiosas",
                "ataques políticos extremos",
                "conteúdo impróprio",
                "flood",
                "spam",
              ]}
            />
            <p>A moderação poderá apagar mensagens, silenciar usuários e aplicar punições.</p>
          </Section>

          <Section id="s9" title="9. Segurança e Privacidade">
            <List
              items={[
                "não compartilhar dados sensíveis rapidamente",
                "ter cautela em conversas",
                "evitar envio de informações financeiras",
                "denunciar comportamentos suspeitos",
              ]}
            />
            <p>
              <strong>Nunca solicitaremos</strong> senhas, códigos bancários ou transferências
              obrigatórias.
            </p>
          </Section>

          <Section id="s10" title="10. Denúncias">
            <p>
              Qualquer usuário poderá denunciar assédio, comportamento inadequado, perfil falso,
              golpes, spam ou ameaças. Toda denúncia será analisada pela equipe administrativa.
            </p>
          </Section>

          <Section id="s11" title="11. Sistema de Penalidades">
            <List
              items={[
                "advertência",
                "suspensão temporária",
                "bloqueio parcial",
                "remoção de conteúdo",
                "banimento permanente",
              ]}
            />
            <p>A gravidade dependerá da infração, reincidência e impacto causado.</p>
          </Section>

          <Section id="s12" title="12. Cancelamento de Conta">
            <p>
              O usuário poderá solicitar exclusão da conta a qualquer momento. A plataforma também
              poderá remover contas inativas, excluir perfis falsos e bloquear usuários que violem
              regras.
            </p>
          </Section>

          <Section id="s13" title="13. Atualizações das Regras">
            <p>
              As regras poderão ser atualizadas periodicamente. O uso contínuo da plataforma
              representa concordância com as atualizações.
            </p>
          </Section>

          <Section id="s14" title="14. Compromisso da Comunidade">
            <p>
              Nosso objetivo é criar um ambiente saudável, respeitoso, seguro, acolhedor, cristão e
              verdadeiro.
            </p>
            <p className="font-medium">
              Relacionamentos saudáveis começam com caráter, honestidade e responsabilidade. Seja
              bem-vindo à comunidade.
            </p>
          </Section>
        </div>
      </main>
    </DocumentShell>
  );
}
