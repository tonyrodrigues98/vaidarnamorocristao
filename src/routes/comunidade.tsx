import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Users, Pencil, Check, X } from "lucide-react";
import { useLongPress } from "@/hooks/use-long-press";

type GMsg = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  edited_at?: string | null;
};
type Profile = { id: string; full_name: string; photo_url: string | null };

export const Route = createFileRoute("/comunidade")({ component: Comunidade });

function Comunidade() {
  const { user, isAdmin, loading } = useAuth();
  const [messages, setMessages] = useState<GMsg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [approved, setApproved] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [actionsOpenId, setActionsOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setApproved((data?.status ?? "pending") === "approved"));
  }, [user]);

  const loadProfiles = async (ids: string[]) => {
    const missing = ids.filter((id) => !profiles[id]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, photo_url")
      .in("id", missing);
    if (data) {
      setProfiles((p) => {
        const next = { ...p };
        for (const pr of data) next[pr.id] = pr as Profile;
        return next;
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from("global_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) { toast.error(error.message); return; }
      if (ignore) return;
      const list = ((data ?? []) as GMsg[]).slice().reverse();
      setMessages(list);
      await loadProfiles(Array.from(new Set(list.map((m) => m.sender_id))));
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    })();

    const ch = supabase
      .channel("global-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "global_messages" },
        async (payload) => {
          const m = payload.new as GMsg;
          setMessages((prev) => [...prev, m]);
          await loadProfiles([m.sender_id]);
          requestAnimationFrame(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "global_messages" },
        (payload) => {
          const old = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== old.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "global_messages" },
        (payload) => {
          const updated = payload.new as GMsg;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }
      )
      .subscribe();
    return () => { ignore = true; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!loading && !user) return <Navigate to="/auth/login" />;

  async function send(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !user) return;
    setSending(true);
    const { error } = await supabase.from("global_messages").insert({ sender_id: user.id, content });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
  }

  async function remove(id: string) {
    const { error } = await supabase.from("global_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
  }

  function startEdit(m: GMsg) {
    setEditingId(m.id);
    setEditText(m.content);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }
  async function saveEdit(id: string) {
    const content = editText.trim().slice(0, 2000);
    if (!content) return;
    const original = messages.find((m) => m.id === id);
    if (original && original.content === content) { cancelEdit(); return; }
    const { error } = await supabase.from("global_messages").update({ content }).eq("id", id);
    if (error) { toast.error("Não foi possível editar."); return; }
    cancelEdit();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <div className="animate-fade-up flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-love shadow-glow">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Comunidade</h1>
            <p className="text-sm text-muted-foreground">Chat global em tempo real — converse com todos</p>
          </div>
        </div>

        <div className="glass mt-6 flex flex-1 flex-col overflow-hidden rounded-3xl shadow-soft">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6" style={{ maxHeight: "calc(100vh - 280px)" }}>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Nenhuma mensagem ainda. Seja o primeiro!
              </div>
            ) : (
              messages.map((m) => {
                const p = profiles[m.sender_id];
                const mine = user && m.sender_id === user.id;
                const canDelete = mine || isAdmin;
                const canEdit = mine;
                const isEditing = editingId === m.id;
                const name = p?.full_name?.split(" ")[0] ?? "Alguém";
                const showActions = actionsOpenId === m.id;
                const enableLongPress = !isEditing && (canEdit || canDelete);
                return (
                  <div key={m.id} className="group flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
                      {p?.photo_url ? (
                        <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-love text-sm font-semibold text-white">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <BubbleWrap
                      enableLongPress={!!enableLongPress}
                      onLongPress={() => setActionsOpenId(m.id)}
                      highlighted={showActions}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold">{name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {m.edited_at ? " · editado" : ""}
                        </span>
                      </div>
                      {isEditing ? (
                        <div className="mt-1 flex flex-col gap-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={2}
                            maxLength={2000}
                            autoFocus
                            className="w-full resize-none rounded-md border border-border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={() => saveEdit(m.id)}>
                              <Check className="mr-1 h-3.5 w-3.5" /> Salvar
                            </Button>
                            <Button type="button" size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="mr-1 h-3.5 w-3.5" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground/90">{m.content}</p>
                      )}
                    </BubbleWrap>
                    {!isEditing && (canEdit || canDelete) && (
                      <div
                        className={`flex shrink-0 items-center gap-1 transition-opacity ${
                          showActions ? "opacity-100" : "opacity-0 pointer-events-none"
                        } md:opacity-0 md:pointer-events-auto md:group-hover:opacity-100 md:focus-within:opacity-100`}
                      >
                        {canEdit && (
                          <button
                            onClick={() => { setActionsOpenId(null); startEdit(m); }}
                            className="rounded-full p-2 text-muted-foreground hover:text-primary"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { setActionsOpenId(null); remove(m.id); }}
                            className="rounded-full p-2 text-muted-foreground hover:text-[var(--rose)]"
                            aria-label="Apagar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-border bg-background/60 p-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={approved === false ? "Aguardando aprovação para enviar mensagens" : "Escreva uma mensagem para a comunidade..."}
              maxLength={2000}
              disabled={!approved || sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!approved || sending || !text.trim()} size="icon" className="rounded-full">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

function BubbleWrap({
  enableLongPress,
  onLongPress,
  highlighted,
  children,
}: {
  enableLongPress: boolean;
  onLongPress: () => void;
  highlighted: boolean;
  children: React.ReactNode;
}) {
  const { pressing, handlers } = useLongPress(onLongPress, 450);
  const bound = enableLongPress ? handlers : {};
  return (
    <div
      {...bound}
      className={`flex-1 min-w-0 rounded-xl transition-all duration-200 ${
        enableLongPress ? "select-none md:select-text" : ""
      } ${pressing ? "scale-[0.98] bg-primary/5 ring-2 ring-primary/30 px-2 -mx-2" : ""} ${
        highlighted ? "bg-primary/10 ring-2 ring-primary/50 px-2 -mx-2" : ""
      }`}
      style={enableLongPress ? { WebkitUserSelect: "none", WebkitTouchCallout: "none" } : undefined}
    >
      {children}
    </div>
  );
}