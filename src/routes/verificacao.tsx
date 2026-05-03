import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RequireApproved } from "@/components/RequireApproved";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { BadgeCheck, Camera, FileText, Loader2, ShieldCheck, Clock, XCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/verificacao")({
  component: () => (<RequireApproved><VerificacaoPage /></RequireApproved>),
});

type Status = "pending" | "approved" | "rejected" | "more_info";
type Req = {
  id: string;
  status: Status;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

function VerificacaoPage() {
  const { user, loading } = useAuth();
  const [verified, setVerified] = useState(false);
  const [request, setRequest] = useState<Req | null>(null);
  const [docType, setDocType] = useState<"rg" | "cnh" | "passaporte" | "outro">("rg");
  const [selfie, setSelfie] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const selfieRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: reqs }] = await Promise.all([
        supabase.from("profiles").select("verified").eq("id", user.id).maybeSingle(),
        supabase
          .from("verification_requests")
          .select("id,status,admin_notes,created_at,reviewed_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      setVerified(!!prof?.verified);
      setRequest((reqs?.[0] as Req | undefined) ?? null);
    })();
  }, [user, reload]);

  async function submit() {
    if (!user) return;
    if (!selfie || !doc) {
      toast.error("Envie a selfie e a foto do documento.");
      return;
    }
    if (selfie.size > MAX_BYTES || doc.size > MAX_BYTES) {
      toast.error("Cada arquivo deve ter no máximo 8MB.");
      return;
    }
    setBusy(true);
    try {
      const stamp = Date.now();
      const selfiePath = `${user.id}/${stamp}-selfie-${sanitize(selfie.name)}`;
      const docPath = `${user.id}/${stamp}-doc-${sanitize(doc.name)}`;
      const up1 = await supabase.storage.from("verifications").upload(selfiePath, selfie, {
        upsert: false,
        contentType: selfie.type,
      });
      if (up1.error) throw up1.error;
      const up2 = await supabase.storage.from("verifications").upload(docPath, doc, {
        upsert: false,
        contentType: doc.type,
      });
      if (up2.error) throw up2.error;
      const { error } = await supabase.from("verification_requests").insert({
        user_id: user.id,
        selfie_path: selfiePath,
        document_path: docPath,
        document_type: docType,
      });
      if (error) throw error;
      toast.success("Solicitação enviada! Vamos analisar em breve.");
      setSelfie(null); setDoc(null);
      if (selfieRef.current) selfieRef.current.value = "";
      if (docRef.current) docRef.current.value = "";
      setReload((n) => n + 1);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar solicitação");
    } finally {
      setBusy(false);
    }
  }

  if (!loading && !user) return <Navigate to="/auth/login" />;

  const canSubmit = !verified && (!request || request.status === "rejected" || request.status === "more_info");

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="animate-fade-up">
          <h1 className="flex items-center gap-2 text-3xl font-semibold">
            <ShieldCheck className="h-7 w-7 text-sky-500" /> Verificação de perfil
          </h1>
          <p className="mt-1 text-muted-foreground">
            Confirme sua identidade e ganhe o selo <VerifiedBadge size="sm" /> Perfil Verificado.
          </p>
        </div>

        {verified && (
          <div className="glass mt-6 flex items-center gap-3 rounded-2xl p-5 shadow-soft">
            <BadgeCheck className="h-8 w-8 text-sky-500" />
            <div>
              <p className="font-semibold">Seu perfil está verificado</p>
              <p className="text-sm text-muted-foreground">O selo já aparece em todo o site.</p>
            </div>
          </div>
        )}

        {!verified && request && (
          <div className="glass mt-6 rounded-2xl p-5 shadow-soft">
            {request.status === "pending" && (
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-amber-500" />
                <div>
                  <p className="font-semibold">Em análise</p>
                  <p className="text-sm text-muted-foreground">
                    Enviada em {new Date(request.created_at).toLocaleString("pt-BR")}.
                  </p>
                </div>
              </div>
            )}
            {request.status === "rejected" && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <XCircle className="h-6 w-6 text-destructive" />
                  <p className="font-semibold">Solicitação rejeitada</p>
                </div>
                {request.admin_notes && (
                  <p className="text-sm text-muted-foreground">Motivo: {request.admin_notes}</p>
                )}
                <p className="text-sm">Você pode enviar uma nova abaixo.</p>
              </div>
            )}
            {request.status === "more_info" && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-6 w-6 text-amber-500" />
                  <p className="font-semibold">Mais informações necessárias</p>
                </div>
                {request.admin_notes && (
                  <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {canSubmit && (
          <div className="glass mt-6 space-y-5 rounded-2xl p-6 shadow-soft">
            <div>
              <Label>Tipo de documento</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as typeof docType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="rg">RG</SelectItem>
                  <SelectItem value="cnh">CNH</SelectItem>
                  <SelectItem value="passaporte">Passaporte</SelectItem>
                  <SelectItem value="outro">Outro doc. oficial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2"><Camera className="h-4 w-4" /> Selfie</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Tire uma selfie clara, em boa iluminação, sem óculos escuros ou boné.
              </p>
              <Input
                ref={selfieRef}
                type="file"
                accept="image/*"
                capture="user"
                className="mt-2"
                onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
              />
            </div>

            <div>
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> Foto do documento</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Documento oficial com foto. Mantemos com acesso restrito apenas à equipe.
              </p>
              <Input
                ref={docRef}
                type="file"
                accept="image/*,application/pdf"
                className="mt-2"
                onChange={(e) => setDoc(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              🔒 Seus arquivos ficam em armazenamento privado. Apenas administradores autorizados podem visualizá-los.
            </div>

            <Button onClick={submit} disabled={busy || !selfie || !doc} className="w-full shadow-glow">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Enviar para análise
            </Button>
          </div>
        )}

        <div className="mt-8 text-sm text-muted-foreground">
          <Link to="/perfil" className="hover:underline">← Voltar para o perfil</Link>
        </div>
      </main>
    </div>
  );
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
}