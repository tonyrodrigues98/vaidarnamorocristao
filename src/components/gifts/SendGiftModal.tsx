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
      <DialogContent
        className="max-w-md overflow-hidden border-white/30 p-0 text-white shadow-2xl"
        style={{
          background:
            "linear-gradient(160deg, #FF5FA2 0%, #FF7BC3 28%, #C084FC 58%, #A855F7 78%, #6D5BFF 100%)",
        }}
      >
        {/* floating orbs */}
        <div className="pointer-events-none absolute -left-12 -top-10 h-44 w-44 rounded-full bg-pink-300/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 top-32 h-48 w-48 rounded-full bg-violet-400/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-fuchsia-400/40 blur-3xl" />

        {/* gradient header */}
        <div className="relative px-6 pb-4 pt-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_15%,rgba(255,255,255,0.35),transparent_60%)]" />
          <DialogHeader className="relative">
            <DialogTitle className="text-center text-xl font-bold text-white drop-shadow">
              Enviar presente
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-3 flex flex-col items-center gap-2">
            <GiftMedia emoji={gift.emoji} imageUrl={gift.image_url} rarity={gift.rarity} size="xl" floating />
            <h3 className="mt-2 text-lg font-bold text-white drop-shadow">{gift.name}</h3>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 px-3 py-1 text-sm font-bold text-amber-950 shadow-lg shadow-amber-500/30 ring-1 ring-white/40">
              <CoinIcon className="h-4 w-4" /> {gift.price_coins} moedas
            </div>
          </div>
        </div>

        <div className="relative space-y-4 p-6">
          {receiver && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/20 p-3 backdrop-blur-xl">
              <Avatar className="h-10 w-10 ring-2 ring-white/60">
                <PhotoAvatarImage src={receiver.photo_url} alt={receiver.full_name} />
                <AvatarFallback>{receiver.full_name?.charAt(0) ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-white/80">Para</p>
                <p className="truncate font-semibold text-white">{receiver.full_name}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-white/90">Mensagem (opcional)</label>
            <Textarea
              rows={2}
              maxLength={120}
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Escreva algo carinhoso..."
              className="mt-1.5 border-white/40 bg-white/25 text-white placeholder:text-white/60 backdrop-blur-xl focus-visible:ring-white/70"
            />
            <p className="mt-1 text-right text-[11px] text-white/80">{msg.length}/120</p>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-300/90 to-yellow-400/90 px-3 py-2 shadow-md shadow-amber-500/30 ring-1 ring-white/50">
            <span className="text-xs font-semibold text-amber-950/80">Saldo atual</span>
            <span className={cn("inline-flex items-center gap-1 font-bold text-amber-950", insufficient && "text-red-700")}>
              <CoinIcon className="h-4 w-4" /> {balance}
            </span>
          </div>

          {insufficient && (
            <p className="rounded-lg bg-red-500/30 px-3 py-2 text-center text-sm font-medium text-white ring-1 ring-red-300/60">
              Moedas insuficientes para este presente.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-white/50 bg-white/15 text-white backdrop-blur-xl hover:bg-white/25 hover:text-white"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-amber-400 via-pink-500 to-fuchsia-500 font-bold text-white shadow-lg shadow-pink-500/40 ring-1 ring-white/40 hover:opacity-95"
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