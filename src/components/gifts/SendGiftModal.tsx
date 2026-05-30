import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { GiftMedia } from "./GiftMedia";
import { sendGift, type VirtualGift, RARITY_STYLE } from "@/lib/gifts";
import { friendlyError } from "@/lib/errors";
import { supabase } from "@/integrations/supabase/client";
import { PhotoAvatarImage } from "@/components/PhotoImg";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Receiver = { id: string; full_name: string; photo_url: string | null };

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gift: VirtualGift | null;
  receiverId: string | null;
  balance: number;
  onSent?: (giftName: string) => void;
};

export function SendGiftModal({ open, onOpenChange, gift, receiverId, balance, onSent }: Props) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [receiver, setReceiver] = useState<Receiver | null>(null);

  useEffect(() => {
    if (!open) {
      setMsg("");
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!receiverId) {
      setReceiver(null);
      return;
    }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, photo_url")
        .eq("id", receiverId)
        .maybeSingle();
      if (alive) setReceiver((data ?? null) as Receiver | null);
    })();
    return () => {
      alive = false;
    };
  }, [receiverId]);

  if (!gift) return null;
  const insufficient = balance < gift.price_coins;
  const r = RARITY_STYLE[gift.rarity];

  async function handleSend() {
    if (!gift || !receiverId) return;
    setBusy(true);
    try {
      await sendGift(receiverId, gift.id, msg.trim() || undefined);
      toast.success("🎁 Presente enviado!");
      onSent?.(gift.name);
      onOpenChange(false);
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-white/20 bg-white/80 backdrop-blur-2xl dark:bg-slate-900/70 p-0">
        {/* gradient header */}
        <div
          className={cn(
            "relative px-6 pb-4 pt-7 bg-gradient-to-br",
            r.gradient,
          )}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
          <DialogHeader className="relative">
            <DialogTitle className="text-center text-xl font-bold">Enviar presente</DialogTitle>
          </DialogHeader>
          <div className="relative mt-3 flex flex-col items-center gap-2">
            <GiftMedia emoji={gift.emoji} imageUrl={gift.image_url} rarity={gift.rarity} size="xl" floating />
            <h3 className="mt-2 text-lg font-bold">{gift.name}</h3>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3 py-1 text-sm font-bold text-amber-700 ring-1 ring-amber-400/40">
              <CoinIcon className="h-4 w-4" /> {gift.price_coins} moedas
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {receiver && (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
              <Avatar className="h-10 w-10">
                <PhotoAvatarImage src={receiver.photo_url} alt={receiver.full_name} />
                <AvatarFallback>{receiver.full_name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Para</p>
                <p className="truncate font-semibold">{receiver.full_name}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Mensagem (opcional)</label>
            <Textarea
              rows={2}
              maxLength={120}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Escreva algo carinhoso..."
              className="mt-1.5"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{msg.length}/120</p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-amber-400/10 px-3 py-2 ring-1 ring-amber-400/20">
            <span className="text-xs text-muted-foreground">Saldo atual</span>
            <span className={cn("inline-flex items-center gap-1 font-bold", insufficient && "text-destructive")}>
              <CoinIcon className="h-4 w-4" /> {balance}
            </span>
          </div>

          {insufficient && (
            <p className="text-center text-sm text-destructive">Moedas insuficientes para este presente.</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={busy}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white hover:opacity-90"
              disabled={busy || insufficient || !receiverId}
              onClick={handleSend}
            >
              <Send className="mr-1 h-4 w-4" /> {busy ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}