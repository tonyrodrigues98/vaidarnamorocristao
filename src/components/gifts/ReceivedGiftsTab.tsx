import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listMyReceivedGifts, redeemGift, RARITY_STYLE, type GiftTransaction } from "@/lib/gifts";
import { GiftMedia } from "./GiftMedia";
import { Button } from "@/components/ui/button";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { Gift, Sparkles, CheckCircle2, Inbox } from "lucide-react";
import { PhotoImg } from "@/components/PhotoImg";
import { cn } from "@/lib/utils";

export function ReceivedGiftsTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<GiftTransaction[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    listMyReceivedGifts(userId)
      .then(setItems)
      .catch(() => setItems([]));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleRedeem(tx: GiftTransaction) {
    if (busy) return;
    setBusy(tx.id);
    try {
      const coins = await redeemGift(tx.id);
      toast.success(`+${coins} moedas creditadas!`);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const heldCount = items?.filter((t) => t.status === "held").length ?? 0;
  const totalReceived = items?.length ?? 0;

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl"
        style={{
          background: "linear-gradient(135deg, #FF5FA2 0%, #A855F7 60%, #6D5BFF 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-pink-300/30 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold backdrop-blur">
              <Sparkles className="h-3 w-3" /> Sua coleção
            </div>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold drop-shadow">
              <Gift className="h-7 w-7" /> Presentes recebidos
            </h2>
            <p className="mt-1 text-sm text-white/90">
              {totalReceived} no total · {heldCount} aguardando resgate
            </p>
          </div>
          <div
            className="hidden rounded-3xl bg-white/20 p-4 text-white drop-shadow-2xl backdrop-blur sm:block"
            style={{ animation: "gift-float 3s ease-in-out infinite" }}
          >
            <Gift className="h-12 w-12" />
          </div>
        </div>
      </div>

      {items === null ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-purple-400/40 bg-purple-500/5 p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-purple-400" />
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            Você ainda não recebeu presentes. Eles aparecerão aqui
            <Sparkles className="h-4 w-4 text-purple-400" />
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((tx) => {
            const g = tx.gift!;
            const r = RARITY_STYLE[g.rarity];
            const redeemValue = Math.max(1, Math.floor(tx.price_paid * 0.3));
            return (
              <div
                key={tx.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl border bg-card/80 p-4 shadow-soft backdrop-blur",
                  r.border,
                  r.glow,
                )}
              >
                <div className="flex gap-3">
                  <GiftMedia
                    emoji={g.emoji}
                    imageUrl={g.image_url}
                    rarity={g.rarity}
                    size="md"
                    floating={tx.status === "held"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="truncate text-sm font-bold">{g.name}</h4>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          r.chip,
                        )}
                      >
                        {r.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {tx.sender_photo ? (
                        <PhotoImg
                          src={tx.sender_photo}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover ring-1 ring-border"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-muted" />
                      )}
                      <p className="truncate text-xs text-muted-foreground">
                        de{" "}
                        <span className="font-medium text-foreground">
                          {tx.sender_name ?? "Alguém"}
                        </span>
                      </p>
                    </div>
                    {tx.message && (
                      <p className="mt-2 line-clamp-2 rounded-lg bg-muted/60 px-2 py-1 text-xs italic text-muted-foreground">
                        “{tx.message}”
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CoinIcon className="h-4 w-4" /> Valor:{" "}
                    <span className="font-semibold text-foreground">{tx.price_paid}</span>
                  </div>
                  {tx.status === "redeemed" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> Resgatado +{tx.redeemed_coins ?? 0}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleRedeem(tx)}
                      disabled={busy === tx.id}
                      className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 shadow-md shadow-amber-400/30 hover:from-amber-300 hover:to-orange-400"
                    >
                      <CoinIcon className="mr-1 h-3.5 w-3.5" /> Resgatar +{redeemValue}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        Ao resgatar, você recebe 30% do valor em moedas. Presentes não resgatados ficam como
        decoração na sua coleção.
      </p>
    </div>
  );
}
