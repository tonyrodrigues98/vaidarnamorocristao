import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Backpack,
  Check,
  Coins,
  Eye,
  PackageOpen,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import {
  V2Button,
  V2Heading,
  V2LoadingIndicator,
  V2StatusBadge,
  V2Surface,
  V2Text,
} from "@/v2/design-system";
import {
  createEconomyCommandKey,
  ECONOMY_ITEM_KINDS,
  formatCoinAmount,
  type EconomyItem,
  type EconomyItemKind,
  type EconomyRepository,
} from "./contracts";

type EconomyTab = "shop" | "inventory" | "ledger";
type PendingCommand =
  | { readonly kind: "purchase"; readonly item: EconomyItem }
  | { readonly kind: "equip"; readonly item: EconomyItem }
  | { readonly kind: "unequip"; readonly item: EconomyItem };

const KIND_LABELS: Record<EconomyItemKind, string> = {
  frame: "Molduras",
  aura: "Auras",
  sticker: "Stickers",
  background: "Fundos",
  "name-gradient": "Gradientes",
};

function createSecureKey() {
  return createEconomyCommandKey(() => {
    if (!globalThis.crypto?.randomUUID) throw new Error("secure_command_key_unavailable");
    return globalThis.crypto.randomUUID();
  });
}

function ItemPreview({ item }: { readonly item: EconomyItem }) {
  const style =
    item.kind === "name-gradient" && item.colorA && item.colorB
      ? { backgroundImage: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})` }
      : undefined;
  return (
    <div className="vdn-v2-economy-card__preview" style={style} aria-hidden="true">
      {item.assetUrl ? <img src={item.assetUrl} alt="" loading="lazy" /> : <Sparkles />}
    </div>
  );
}

function ItemCard({
  item,
  previewed,
  busy,
  onPreview,
  onCommand,
}: {
  readonly item: EconomyItem;
  readonly previewed: boolean;
  readonly busy: boolean;
  readonly onPreview: () => void;
  readonly onCommand: (command: PendingCommand) => void;
}) {
  return (
    <V2Surface
      as="article"
      elevation={previewed ? "two" : "one"}
      padding="none"
      className="vdn-v2-economy-card"
    >
      <ItemPreview item={item} />
      <div className="vdn-v2-economy-card__body">
        <div>
          <V2Heading level={3} size="small">
            {item.name}
          </V2Heading>
          <V2Text tone="muted">{item.description || KIND_LABELS[item.kind]}</V2Text>
        </div>
        <div className="vdn-v2-economy-card__meta">
          <V2StatusBadge tone={item.equipped ? "success" : "neutral"}>
            {item.equipped ? "Equipado" : item.rarity}
          </V2StatusBadge>
          <V2Text variant="label">
            <Coins aria-hidden="true" /> {formatCoinAmount(item.price)}
          </V2Text>
        </div>
        <div className="vdn-v2-economy-card__actions">
          <V2Button
            variant="ghost"
            size="small"
            leadingIcon={<Eye />}
            aria-pressed={previewed}
            onClick={onPreview}
          >
            Prévia
          </V2Button>
          {item.owned ? (
            <V2Button
              variant={item.equipped ? "outline" : "secondary"}
              size="small"
              loading={busy}
              disabled={!item.active}
              leadingIcon={item.equipped ? <Check /> : <Star />}
              onClick={() => onCommand({ kind: item.equipped ? "unequip" : "equip", item })}
            >
              {item.equipped ? "Retirar" : "Equipar"}
            </V2Button>
          ) : (
            <V2Button
              size="small"
              loading={busy}
              disabled={!item.active}
              leadingIcon={<ShoppingBag />}
              onClick={() => onCommand({ kind: "purchase", item })}
            >
              Comprar
            </V2Button>
          )}
        </div>
      </div>
    </V2Surface>
  );
}

export function V2EconomyHub({
  userId,
  repository,
}: {
  readonly userId: string;
  readonly repository: EconomyRepository;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<EconomyTab>("shop");
  const [kind, setKind] = useState<EconomyItemKind | "all">("all");
  const [previewedId, setPreviewedId] = useState("");
  const [pending, setPending] = useState<PendingCommand | null>(null);
  const [feedback, setFeedback] = useState("");
  const queryKey = useMemo(() => ["v2", "economy-hub", userId] as const, [userId]);
  const hub = useQuery({
    queryKey,
    queryFn: () => repository.loadHub(userId),
    staleTime: 15_000,
  });

  const command = useMutation({
    mutationFn: async (next: PendingCommand) => {
      const key = createSecureKey();
      if (next.kind === "purchase") {
        return repository.purchase(userId, next.item, key);
      }
      return repository.setEquipped(
        userId,
        next.item.kind,
        next.kind === "equip" ? next.item.id : null,
        key,
      );
    },
    onSuccess: (receipt) => {
      setFeedback(
        receipt.action === "purchase"
          ? "Compra concluída e registrada no recibo."
          : receipt.action === "equip"
            ? "Item equipado."
            : "Item retirado.",
      );
      setPending(null);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      setFeedback("Não foi possível concluir a ação. Nenhum dado foi alterado.");
      setPending(null);
    },
  });

  if (hub.isPending) {
    return (
      <V2Surface className="vdn-v2-economy-state" aria-live="polite">
        <V2LoadingIndicator label="Carregando loja e inventário" />
      </V2Surface>
    );
  }

  if (hub.isError || !hub.data) {
    return (
      <V2Surface className="vdn-v2-economy-state" role="alert">
        <PackageOpen aria-hidden="true" />
        <V2Heading level={2} size="small">
          Loja temporariamente indisponível
        </V2Heading>
        <V2Text tone="muted">Seu saldo e inventário não foram alterados.</V2Text>
        <V2Button variant="secondary" onClick={() => void hub.refetch()}>
          Tentar novamente
        </V2Button>
      </V2Surface>
    );
  }

  const snapshot = hub.data;
  const source = tab === "inventory" ? snapshot.inventory : snapshot.catalog;
  const visibleItems = source.filter((item) => kind === "all" || item.kind === kind);
  const selected = source.find((item) => item.id === previewedId) ?? visibleItems[0] ?? null;
  const boxesGate = snapshot.riskGates.find((gate) => gate.feature === "chance_based_boxes");

  return (
    <div className="vdn-v2-economy" aria-labelledby="vdn-v2-economy-title">
      <V2Surface className="vdn-v2-economy__summary" elevation="one">
        <div>
          <V2Heading id="vdn-v2-economy-title" level={2} size="medium">
            Loja e inventário
          </V2Heading>
          <V2Text tone="muted">
            Itens preservados, compra com preço do servidor e equipamento por propriedade.
          </V2Text>
        </div>
        <dl>
          <div>
            <dt>Moedas</dt>
            <dd>
              <Coins aria-hidden="true" /> {formatCoinAmount(snapshot.balance)}
            </dd>
          </div>
          <div>
            <dt>Nível</dt>
            <dd>{snapshot.level}</dd>
          </div>
          <div>
            <dt>XP</dt>
            <dd>{formatCoinAmount(snapshot.xpTotal)}</dd>
          </div>
        </dl>
      </V2Surface>

      <div className="vdn-v2-economy__tabs" role="tablist" aria-label="Economia">
        {(
          [
            ["shop", "Loja", <ShoppingBag key="shop" />],
            ["inventory", "Inventário", <Backpack key="inventory" />],
            ["ledger", "Extrato", <ReceiptText key="ledger" />],
          ] as const
        ).map(([value, label, icon]) => (
          <V2Button
            key={value}
            role="tab"
            size="small"
            variant={tab === value ? "secondary" : "ghost"}
            aria-selected={tab === value}
            leadingIcon={icon}
            onClick={() => setTab(value)}
          >
            {label}
          </V2Button>
        ))}
      </div>

      {snapshot.reconciliation.status !== "consistent" ? (
        <V2Surface className="vdn-v2-economy__notice" role="status" tone="subtle">
          <ShieldCheck aria-hidden="true" />
          <div>
            <V2Text variant="label">Reconciliação protegida</V2Text>
            <V2Text tone="muted">
              {snapshot.reconciliation.status === "baseline-unverified"
                ? "Ainda não há um lançamento final comparável. Nenhum saldo será reescrito."
                : "Foi encontrada uma divergência para investigação. Nenhuma correção automática foi feita."}
            </V2Text>
          </div>
        </V2Surface>
      ) : null}

      {tab !== "ledger" ? (
        <>
          <div className="vdn-v2-economy__filters">
            <label htmlFor="vdn-v2-economy-kind">Tipo de item</label>
            <select
              id="vdn-v2-economy-kind"
              value={kind}
              onChange={(event) => setKind(event.currentTarget.value as EconomyItemKind | "all")}
            >
              <option value="all">Todos</option>
              {ECONOMY_ITEM_KINDS.map((itemKind) => (
                <option key={itemKind} value={itemKind}>
                  {KIND_LABELS[itemKind]}
                </option>
              ))}
            </select>
          </div>

          {selected ? (
            <V2Surface className="vdn-v2-economy__live-preview" tone="subtle">
              <ItemPreview item={selected} />
              <div>
                <V2Text variant="label">Prévia sem alterar equipamento</V2Text>
                <V2Heading level={3} size="small">
                  {selected.name}
                </V2Heading>
                <V2Text tone="muted">
                  Confirme uma ação abaixo somente quando quiser persistir a escolha.
                </V2Text>
              </div>
            </V2Surface>
          ) : null}

          {visibleItems.length ? (
            <div className="vdn-v2-economy__grid">
              {visibleItems.map((item) => (
                <ItemCard
                  key={`${item.kind}:${item.id}`}
                  item={item}
                  previewed={selected?.id === item.id}
                  busy={command.isPending && pending?.item.id === item.id}
                  onPreview={() => setPreviewedId(item.id)}
                  onCommand={setPending}
                />
              ))}
            </div>
          ) : (
            <V2Surface className="vdn-v2-economy-state">
              <PackageOpen aria-hidden="true" />
              <V2Text>
                {tab === "inventory"
                  ? "Nenhum item desta categoria está no seu inventário."
                  : "Nenhum item disponível nesta categoria."}
              </V2Text>
            </V2Surface>
          )}
        </>
      ) : (
        <V2Surface className="vdn-v2-economy__ledger">
          <V2Heading level={3} size="small">
            Últimas movimentações
          </V2Heading>
          {snapshot.ledger.length ? (
            <ol>
              {snapshot.ledger.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{entry.title}</strong>
                    <span>{entry.subtitle}</span>
                  </div>
                  <div>
                    <span className={entry.amount >= 0 ? "is-credit" : "is-debit"}>
                      {entry.amount >= 0 ? "+" : ""}
                      {formatCoinAmount(entry.amount)}
                    </span>
                    <small>Saldo {formatCoinAmount(entry.balanceAfter)}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <V2Text tone="muted">Ainda não há movimentações disponíveis.</V2Text>
          )}
        </V2Surface>
      )}

      <V2Surface className="vdn-v2-economy__preservation" tone="subtle">
        <V2Heading level={3} size="small">
          Famílias preservadas
        </V2Heading>
        <V2Text tone="muted">
          Badges, presentes, avatar legado e itens de pets continuam em inventários separados.
          Nenhuma consolidação foi feita.
        </V2Text>
        <div>
          <V2StatusBadge>{snapshot.preservedFamilies.badges} badges</V2StatusBadge>
          <V2StatusBadge>{snapshot.preservedFamilies.giftsReceived} presentes</V2StatusBadge>
          <V2StatusBadge>
            {snapshot.preservedFamilies.avatarLegacyItems} itens de avatar
          </V2StatusBadge>
          <V2StatusBadge>{snapshot.preservedFamilies.petBackgrounds} fundos de pet</V2StatusBadge>
        </div>
        {boxesGate?.enabled === false ? (
          <V2Text variant="caption">
            Caixas de chance permanecem indisponíveis até revisão comercial, jurídica e de
            transparência.
          </V2Text>
        ) : null}
      </V2Surface>

      {pending ? (
        <V2Surface
          className="vdn-v2-economy__confirmation"
          elevation="two"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vdn-v2-economy-confirm-title"
        >
          <V2Heading id="vdn-v2-economy-confirm-title" level={3} size="small">
            {pending.kind === "purchase"
              ? `Comprar ${pending.item.name}?`
              : pending.kind === "equip"
                ? `Equipar ${pending.item.name}?`
                : `Retirar ${pending.item.name}?`}
          </V2Heading>
          <V2Text tone="muted">
            {pending.kind === "purchase"
              ? `O servidor confirmará o preço atual de ${formatCoinAmount(pending.item.price)} moedas e a entrega atômica.`
              : "A propriedade e a disponibilidade serão confirmadas pelo servidor."}
          </V2Text>
          <div>
            <V2Button variant="ghost" onClick={() => setPending(null)}>
              Cancelar
            </V2Button>
            <V2Button loading={command.isPending} onClick={() => command.mutate(pending)}>
              Confirmar
            </V2Button>
          </div>
        </V2Surface>
      ) : null}

      {feedback ? (
        <p className="vdn-v2-economy__feedback" role="status">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
