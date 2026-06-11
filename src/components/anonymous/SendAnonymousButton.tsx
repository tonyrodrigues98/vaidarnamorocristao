import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Lock } from "lucide-react";
import { toast } from "sonner";
import { friendlyError } from "@/lib/errors";

type Props = { receiverId: string };

export function SendAnonymousButton({ receiverId }: Props) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [canSend, setCanSend] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.rpc("get_anonymous_cooldown", {
        _receiver_id: receiverId,
      });
      if (!active) return;
      if (error || !data || !data[0]) {
        setCanSend(false);
        return;
      }
      const row = data[0];
      setCanSend(row.can_send);
      setReason(row.reason ?? "");
      setSecondsLeft(row.seconds_remaining ?? 0);
    };
    load();
    return () => {
      active = false;
    };
  }, [receiverId]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const reasonLabel = (r: string) => {
    if (r === "incompatible") return "Disponível apenas para o sexo oposto.";
    if (r === "opted_out") return "Esta pessoa não aceita recados anônimos.";
    if (r === "active_exists") return "Você já tem um recado ativo com esta pessoa.";
    if (r === "daily_limit")
      return "Limite diário atingido. Compre recados extras em Recados › Configurações.";
    if (r === "cooldown") {
      const d = Math.ceil(secondsLeft / 86400);
      return `Aguarde ${d} dia${d > 1 ? "s" : ""} para enviar outro recado.`;
    }
    return "Não é possível enviar agora.";
  };

  const send = async () => {
    if (content.trim().length === 0) return;
    setBusy(true);
    const { error } = await supabase.rpc("send_anonymous_message", {
      _receiver_id: receiverId,
      _content: content.trim(),
    });
    setBusy(false);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success("Recado anônimo enviado");
    setOpen(false);
    setContent("");
    setCanSend(false);
    setReason("active_exists");
  };

  if (canSend === null) return null;

  if (!canSend) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-auto min-h-9 w-full min-w-0 max-w-full items-start whitespace-normal break-words py-2 text-left leading-snug"
        disabled
      >
        <Lock className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 break-words">{reasonLabel(reason)}</span>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Sparkles className="mr-2 h-4 w-4" /> Enviar recado anônimo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--rose)]" /> Recado anônimo
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Sua identidade ficará oculta. Ela só será revelada se ambos aceitarem.
        </p>
        <Textarea
          rows={4}
          maxLength={280}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva algo leve e respeitoso..."
        />
        <div className="text-right text-xs text-muted-foreground">{content.length}/280</div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={send} disabled={busy || content.trim().length === 0}>
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
