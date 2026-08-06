import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, HeartHandshake, CheckCircle2, Lock, Gem } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  createCommitmentRequest,
  getPendingCommitment,
  acceptCommitment,
  rejectCommitment,
} from "@/lib/commitments";
import { toast } from "sonner";
import { getCommitmentProgress, type CommitmentProgress } from "@/lib/commitmentProgress";

interface CommitmentProgressCardProps {
  matchId: string;
}

export function CommitmentProgressCard({ matchId }: CommitmentProgressCardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [commitment, setCommitment] = useState<any>(null);
  const [progress, setProgress] = useState<CommitmentProgress | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, c] = await Promise.all([
          getCommitmentProgress(matchId),
          getPendingCommitment(matchId),
        ]);
        if (!mounted) return;
        setProgress(p);
        setCommitment(c);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [matchId]);

  async function handleAccept() {
    if (!commitment) return;
    await acceptCommitment(commitment.id);
    setCommitment(await getPendingCommitment(matchId));
  }

  async function handleReject() {
    if (!commitment) return;
    await rejectCommitment(commitment.id);
    setCommitment(null);
  }

  async function handleCommitment() {
    if (!user) return;
    try {
      setCreating(true);
      const { data: match } = await supabase
        .from("matches")
        .select("user_a,user_b")
        .eq("id", matchId)
        .single();
      if (!match) {
        toast.error("Match não encontrado.");
        return;
      }
      await createCommitmentRequest(matchId, match.user_a, match.user_b, user.id);
      toast.success("Solicitação enviada.");
      setCommitment(await getPendingCommitment(matchId));
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar a solicitação.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-primary/15 bg-primary/5">
        <CardContent className="p-4">Carregando progresso...</CardContent>
      </Card>
    );
  }

  if (!progress) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Caminho para Firmar Propósito</h3>
            <p className="text-xs text-muted-foreground">
              Construam uma conexão antes do compromisso.
            </p>
          </div>
        </div>

        <Progress value={progress.percentage} />
        <p className="text-sm font-medium">{progress.percentage}% concluído</p>

        <div className="space-y-2">
          <Requirement done={progress.requirements.hasMatch} label="Match realizado" />
          <Requirement
            done={progress.requirements.threeConversationDays}
            label="3 dias de conversa"
          />
          <Requirement
            done={progress.requirements.twentyMessagesEach}
            label="20 mensagens de cada lado"
          />
        </div>

        {commitment?.status === "active" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-emerald-600" />

              <span className="font-semibold text-emerald-700">Propósito Firmado</span>
            </div>

            <p className="mt-2 text-sm text-emerald-700/80">O propósito foi aceito e está ativo.</p>

            <Button asChild className="mt-4 w-full gap-2" variant="outline">
              <Link
                to="/proposito/$matchId"
                params={{
                  matchId,
                }}
              >
                <Gem className="h-4 w-4" />
                Ver Página do Casal
              </Link>
            </Button>
          </div>
        ) : commitment?.status === "pending" && commitment.requested_by !== user?.id ? (
          <div className="flex gap-2">
            <Button onClick={handleAccept}>Aceitar</Button>
            <Button variant="outline" onClick={handleReject}>
              Recusar
            </Button>
          </div>
        ) : commitment?.status === "pending" && commitment.requested_by === user?.id ? (
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Solicitação enviada. Aguardando resposta.
          </div>
        ) : progress.canCommit ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="mb-3 flex items-center gap-2">
              <Gem className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                Prontos para firmar propósito
              </span>
            </div>
            <Button onClick={handleCommitment} disabled={creating} className="w-full gap-2">
              <HeartHandshake className="h-4 w-4" />
              Firmar Propósito
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Continue conversando para desbloquear.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Requirement({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2
        className={done ? "h-4 w-4 text-emerald-500" : "h-4 w-4 text-muted-foreground"}
      />
      <span className={done ? "text-sm" : "text-sm text-muted-foreground"}>{label}</span>
    </div>
  );
}
