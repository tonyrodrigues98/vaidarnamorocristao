import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Check, X, RefreshCw, Settings, History, Image as ImageIcon, Eye, Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/fotos")({ component: AdminFotos });

type Status = "pending" | "approved" | "rejected";
type Scope = "avatar" | "extra";
type AiResult = { confidence?: number; reason?: string } | null;

type QueueItem = {
  id: string;
  user_id: string;
  photo_url: string;
  scope: Scope;
  photo_id: string | null;
  ai_result: AiResult;
  status: Status;
  created_at: string;
};

type LogItem = {
  id: string;
  user_id: string;
  scope: Scope;
  photo_url: string | null;
  decision: "approved" | "needs_review" | "rejected" | "soft_fail";
  confidence: number | null;
  reason: string | null;
  ai_result: AiResult;
  created_at: string;
};

type ProfileLite = {
  id: string;
  full_name: string | null;
  photo_url: string | null;
  age?: number | null;
  city?: string | null;
  state?: string | null;
  church?: string | null;
  status?: string | null;
};

type Settings = {
  extra_reject_threshold: number;
  extra_review_threshold: number;
  main_approve_threshold: number;
  main_review_threshold: number;
  updated_at: string;
};

function AdminFotos() {
  const { user, isAdmin, role, loading } = useAuth();
  const isSuper = role === "super_admin";
  const canAccess = isAdmin || isSuper;

  type TabKey = "queue" | "history" | "settings";
  const [tab, setTab] = useState<TabKey>("queue");
  const [queueStatus, setQueueStatus] = useState<Status>("pending");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [busy, setBusy] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draftSettings, setDraftSettings] = useState<Settings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [openLog, setOpenLog] = useState<LogItem | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  async function loadProfilesFor(ids: string[]) {
    const fresh = ids.filter((id) => !profiles.has(id));
    if (!fresh.length) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url, age, city, state, church, status")
      .in("id", fresh);
    if (!data) return;
    setProfiles((prev) => {
      const next = new Map(prev);
      for (const p of data) next.set(p.id, p as ProfileLite);
      return next;
    });
  }

  async function loadQueue() {
    const { data, error } = await supabase
      .from("photo_moderation_queue")
      .select("*")
      .eq("status", queueStatus)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error(error.message);
      return;
    }
    const items = (data ?? []) as unknown as QueueItem[];
    setQueue(items);
    void loadProfilesFor(Array.from(new Set(items.map((i) => i.user_id))));
  }

  async function loadLogs() {
    const { data, error } = await supabase
      .from("photo_moderation_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) {
      toast.error(error.message);
      return;
    }
    const items = (data ?? []) as unknown as LogItem[];
    setLogs(items);
    void loadProfilesFor(Array.from(new Set(items.map((i) => i.user_id))));
  }

  async function loadSettings() {
    const { data, error } = await supabase
      .from("photo_moderation_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      const s: Settings = {
        extra_reject_threshold: Number(data.extra_reject_threshold),
        extra_review_threshold: Number(data.extra_review_threshold),
        main_approve_threshold: Number(data.main_approve_threshold),
        main_review_threshold: Number(data.main_review_threshold),
        updated_at: data.updated_at,
      };
      setSettings(s);
      setDraftSettings(s);
    }
  }

  useEffect(() => {
    if (!canAccess) return;
    if (tab === "queue") void loadQueue();
    else if (tab === "history") void loadLogs();
    else if (tab === "settings") void loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAccess, tab, queueStatus]);

  async function approve(item: QueueItem) {
    setBusy(item.id);
    const { error } = await supabase
      .from("photo_moderation_queue")
      .update({ status: "approved", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) {
      toast.error(error.message);
      setBusy(null);
      return;
    }
    if (item.scope === "avatar") {
      await supabase.from("profiles").update({ avatar_ai_verified: true }).eq("id", item.user_id);
    } else if (item.photo_id) {
      await supabase.from("profile_photos").update({ ai_verified: true }).eq("id", item.photo_id);
    }
    toast.success("Foto aprovada");
    setBusy(null);
    void loadQueue();
  }

  async function reject(item: QueueItem) {
    if (!confirm("Rejeitar e remover esta foto?")) return;
    setBusy(item.id);
    const marker = "/profile-photos/";
    const idx = item.photo_url.indexOf(marker);
    if (idx > -1) {
      const path = item.photo_url.substring(idx + marker.length).split("?")[0];
      await supabase.storage.from("profile-photos").remove([path]);
    }
    if (item.scope === "avatar") {
      await supabase
        .from("profiles")
        .update({ photo_url: null, avatar_ai_verified: false })
        .eq("id", item.user_id);
    } else if (item.photo_id) {
      await supabase.from("profile_photos").delete().eq("id", item.photo_id);
    }
    const { error } = await supabase
      .from("photo_moderation_queue")
      .update({ status: "rejected", reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) toast.error(error.message);
    else toast.success("Foto rejeitada");
    setBusy(null);
    void loadQueue();
  }

  async function saveSettings() {
    if (!draftSettings) return;
    if (
      draftSettings.extra_reject_threshold < draftSettings.extra_review_threshold ||
      draftSettings.main_approve_threshold < draftSettings.main_review_threshold
    ) {
      toast.error("O limiar de bloqueio/aprovação deve ser maior que o de revisão.");
      return;
    }
    setSavingSettings(true);
    const { error } = await supabase
      .from("photo_moderation_settings")
      .update({
        extra_reject_threshold: draftSettings.extra_reject_threshold,
        extra_review_threshold: draftSettings.extra_review_threshold,
        main_approve_threshold: draftSettings.main_approve_threshold,
        main_review_threshold: draftSettings.main_review_threshold,
        updated_at: new Date().toISOString(),
        updated_by: user!.id,
      })
      .eq("id", true);
    setSavingSettings(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Limiares atualizados");
    void loadSettings();
  }

  // Group queue items by user
  const queueByUser = useMemo(() => {
    const map = new Map<string, QueueItem[]>();
    for (const it of queue) {
      const arr = map.get(it.user_id) ?? [];
      arr.push(it);
      map.set(it.user_id, arr);
    }
    return Array.from(map.entries());
  }, [queue]);

  const logsByUser = useMemo(() => {
    const map = new Map<string, LogItem[]>();
    for (const it of logs) {
      const arr = map.get(it.user_id) ?? [];
      arr.push(it);
      map.set(it.user_id, arr);
    }
    return Array.from(map.entries());
  }, [logs]);

  async function deleteLogPhoto(item: LogItem) {
    const reason = deleteReason.trim();
    if (!reason) {
      toast.error("Escreva o motivo da remoção (será enviado ao usuário).");
      return;
    }
    setDeletingPhoto(true);
    try {
      // Apaga arquivo público em profile-photos (se ainda for foto ativa do perfil)
      if (item.photo_url) {
        const marker = "/profile-photos/";
        const idx = item.photo_url.indexOf(marker);
        if (idx > -1) {
          const path = item.photo_url.substring(idx + marker.length).split("?")[0];
          await supabase.storage.from("profile-photos").remove([path]);
        }
      }
      // RPC: remove do perfil, registra log e notifica usuário com a foto e o motivo
      const { error } = await supabase.rpc("admin_delete_user_photo", {
        _user_id: item.user_id,
        _photo_id: null,
        _scope: item.scope,
        _photo_url: item.photo_url ?? item.signed_url ?? null,
        _reason: reason,
      });
      if (error) throw error;
      toast.success("Foto apagada e usuário notificado");
      setDeleteReason("");
      setOpenLog(null);
      void loadLogs();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Não foi possível apagar a foto");
    } finally {
      setDeletingPhoto(false);
    }
  }

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;
  if (!canAccess) return <Navigate to="/inicio" />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin">
              <ArrowLeft className="mr-1 h-4 w-4" /> Admin
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Análise de Fotos</h1>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList>
            <TabsTrigger value="queue">
              <ImageIcon className="mr-1 h-4 w-4" /> Fila
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-1 h-4 w-4" /> Histórico
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-1 h-4 w-4" /> Limiares
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-4">
            <div className="mb-4 flex items-center gap-2">
              {(["pending", "approved", "rejected"] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setQueueStatus(s)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    queueStatus === s ? "bg-foreground text-background" : "bg-card"
                  }`}
                >
                  {s === "pending" ? "Pendentes" : s === "approved" ? "Aprovadas" : "Rejeitadas"}
                </button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => void loadQueue()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {queueByUser.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma foto nesta fila.</p>
            ) : (
              <div className="space-y-6">
                {queueByUser.map(([uid, items]) => {
                  const prof = profiles.get(uid);
                  return (
                    <section key={uid} className="rounded-2xl border bg-card p-4">
                      <header className="mb-3 flex items-center gap-3">
                        {prof?.photo_url ? (
                          <img
                            src={prof.photo_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted" />
                        )}
                        <div>
                          <div className="text-sm font-medium">
                            {prof?.full_name ?? "Perfil sem nome"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {items.length} foto(s) • {items.filter((i) => i.scope === "avatar").length} avatar •{" "}
                            {items.filter((i) => i.scope === "extra").length} adicional
                          </div>
                        </div>
                      </header>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((it) => (
                          <div key={it.id} className="overflow-hidden rounded-xl border bg-background">
                            <img src={it.photo_url} alt="" className="aspect-square w-full object-cover" />
                            <div className="space-y-2 p-3">
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={`rounded-full px-2 py-0.5 ${
                                    it.scope === "avatar"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {it.scope === "avatar" ? "Foto principal" : "Foto adicional"}
                                </span>
                                <span className="text-muted-foreground">
                                  {Math.round((it.ai_result?.confidence ?? 0) * 100)}%
                                </span>
                              </div>
                              {it.ai_result?.reason && (
                                <p className="text-xs text-muted-foreground">{it.ai_result.reason}</p>
                              )}
                              {queueStatus === "pending" && (
                                <div className="flex gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    onClick={() => approve(it)}
                                    disabled={busy === it.id}
                                    className="flex-1"
                                  >
                                    <Check className="mr-1 h-4 w-4" /> Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => reject(it)}
                                    disabled={busy === it.id}
                                    className="flex-1"
                                  >
                                    <X className="mr-1 h-4 w-4" /> Rejeitar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Cada verificação por IA é registrada para auditoria (até 300 últimas).
              </p>
              <Button variant="ghost" size="sm" onClick={() => void loadLogs()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {logsByUser.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registros.</p>
            ) : (
              <div className="space-y-4">
                {logsByUser.map(([uid, items]) => {
                  const prof = profiles.get(uid);
                  return (
                    <section key={uid} className="rounded-2xl border bg-card p-4">
                      <header className="mb-3 flex items-center gap-3">
                        {prof?.photo_url ? (
                          <img
                            src={prof.photo_url}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-muted" />
                        )}
                        <div className="text-sm font-medium">
                          {prof?.full_name ?? "Perfil"}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {items.length} verificação(ões)
                          </span>
                        </div>
                      </header>
                      <ul className="divide-y">
                        {items.map((it) => (
                          <li key={it.id} className="flex items-center gap-3 py-2 text-sm">
                            <button
                              type="button"
                              onClick={() => setOpenLog(it)}
                              className="shrink-0 overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              aria-label="Abrir detalhes"
                            >
                              {it.photo_url ? (
                                <img
                                  src={it.photo_url}
                                  alt=""
                                  className="h-12 w-12 rounded-md object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                  <ImageIcon className="h-4 w-4" />
                                </div>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenLog(it)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs ${
                                    it.scope === "avatar"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {it.scope === "avatar" ? "Principal" : "Adicional"}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs ${decisionClass(
                                    it.decision
                                  )}`}
                                >
                                  {decisionLabel(it.decision)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {it.confidence !== null
                                    ? `${Math.round(it.confidence * 100)}%`
                                    : "—"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(it.created_at).toLocaleString("pt-BR")}
                                </span>
                              </div>
                              {it.reason && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {it.reason}
                                </p>
                              )}
                            </button>
                            <div className="hidden shrink-0 gap-1 sm:flex">
                              <Button asChild size="sm" variant="ghost" title="Ver perfil">
                                <Link to="/pretendentes/$id" params={{ id: it.user_id }}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="text-lg font-semibold">Limiares de confiança da IA</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste o quão restritivo o sistema é. Valores entre 0 e 1.
              </p>
              {!draftSettings ? (
                <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <ThresholdField
                    label="Foto principal — aprovar acima de"
                    help="Confiança mínima para aprovar automaticamente o avatar (rosto único, real)."
                    value={draftSettings.main_approve_threshold}
                    onChange={(v) =>
                      setDraftSettings({ ...draftSettings, main_approve_threshold: v })
                    }
                  />
                  <ThresholdField
                    label="Foto principal — revisar acima de"
                    help="Abaixo deste valor a foto é rejeitada de cara; entre os dois vai para revisão."
                    value={draftSettings.main_review_threshold}
                    onChange={(v) =>
                      setDraftSettings({ ...draftSettings, main_review_threshold: v })
                    }
                  />
                  <ThresholdField
                    label="Foto adicional — bloquear acima de"
                    help="Bloqueia se a IA tem essa confiança de que é conteúdo explícito."
                    value={draftSettings.extra_reject_threshold}
                    onChange={(v) =>
                      setDraftSettings({ ...draftSettings, extra_reject_threshold: v })
                    }
                  />
                  <ThresholdField
                    label="Foto adicional — revisar acima de"
                    help="Entre revisar e bloquear: foto entra na fila para revisão manual."
                    value={draftSettings.extra_review_threshold}
                    onChange={(v) =>
                      setDraftSettings({ ...draftSettings, extra_review_threshold: v })
                    }
                  />
                </div>
              )}
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={() => void saveSettings()} disabled={savingSettings || !draftSettings}>
                  Salvar limiares
                </Button>
                {settings && (
                  <span className="text-xs text-muted-foreground">
                    Última atualização:{" "}
                    {new Date(settings.updated_at).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Dialog open={!!openLog} onOpenChange={(o) => !o && setOpenLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Análise da foto</DialogTitle>
            <DialogDescription>
              Visualização completa para auditoria. Você pode abrir o perfil ou apagar a foto definitivamente.
            </DialogDescription>
          </DialogHeader>
          {openLog && (() => {
            const prof = profiles.get(openLog.user_id);
            return (
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                <div className="overflow-hidden rounded-xl border bg-muted">
                  {openLog.photo_url ? (
                    <img
                      src={openLog.photo_url}
                      alt=""
                      className="h-full max-h-[60vh] w-full object-contain"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-sm text-muted-foreground">
                      Foto não disponível
                    </div>
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    {prof?.photo_url ? (
                      <img src={prof.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted" />
                    )}
                    <div>
                      <div className="font-medium">{prof?.full_name ?? "Sem nome"}</div>
                      <div className="text-xs text-muted-foreground">
                        {prof?.age ? `${prof.age} anos` : ""}
                        {prof?.city ? ` • ${prof.city}${prof?.state ? "/" + prof.state : ""}` : ""}
                      </div>
                      {prof?.church && (
                        <div className="text-xs text-muted-foreground">{prof.church}</div>
                      )}
                      {prof?.status && (
                        <div className="mt-1 text-xs">
                          <span className="rounded-full bg-muted px-2 py-0.5">Status: {prof.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 ${openLog.scope === "avatar" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {openLog.scope === "avatar" ? "Foto principal" : "Foto adicional"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 ${decisionClass(openLog.decision)}`}>
                      {decisionLabel(openLog.decision)}
                    </span>
                    {openLog.confidence !== null && (
                      <span className="text-muted-foreground">
                        Confiança: {Math.round(openLog.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  {openLog.reason && (
                    <p className="text-xs text-muted-foreground">{openLog.reason}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(openLog.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            );
          })()}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            {openLog && (
              <Button asChild variant="outline" className="sm:mr-auto">
                <Link to="/pretendentes/$id" params={{ id: openLog.user_id }}>
                  <ExternalLink className="mr-1 h-4 w-4" /> Ver perfil
                </Link>
              </Button>
            )}
            <Button variant="ghost" onClick={() => setOpenLog(null)}>Fechar</Button>
            <Button
              variant="destructive"
              onClick={() => openLog && deleteLogPhoto(openLog)}
              disabled={deletingPhoto || !openLog?.photo_url}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Apagar foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThresholdField({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(1, Math.max(0, n)));
        }}
      />
      <p className="text-xs text-muted-foreground">{help}</p>
    </div>
  );
}

function decisionLabel(d: LogItem["decision"]) {
  return d === "approved"
    ? "Aprovada"
    : d === "needs_review"
    ? "Revisão"
    : d === "rejected"
    ? "Rejeitada"
    : "IA indisponível";
}

function decisionClass(d: LogItem["decision"]) {
  return d === "approved"
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : d === "needs_review"
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
    : d === "rejected"
    ? "bg-red-500/10 text-red-700 dark:text-red-400"
    : "bg-muted text-muted-foreground";
}