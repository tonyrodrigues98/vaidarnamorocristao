import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Trash2 } from "lucide-react";

type Msg = { id: string; sender_id: string; content: string; created_at: string; read_at: string | null };
type Partner = { id: string; full_name: string; photo_url: string | null };

export const Route = createFileRoute("/conversas/$matchId")({ component: Chat });

function Chat() {
  const { matchId } = Route.useParams();
  const { user, loading } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: m } = await supabase.from("matches").select("user_a, user_b").eq("id", matchId).maybeSingle();
      if (!m || (m.user_a !== user.id && m.user_b !== user.id)) { setAuthorized(false); return; }
      setAuthorized(true);
      const partnerId = m.user_a === user.id ? m.user_b : m.user_a;
      const { data: p } = await supabase.from("profiles").select("id,full_name,photo_url").eq("id", partnerId).maybeSingle();
      setPartner(p as Partner | null);
      const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at");
      setMessages((msgs ?? []) as Msg[]);
      // mark received as read
      await supabase.from("messages").update({ read_at: new Date().toISOString() })
        .eq("match_id", matchId).neq("sender_id", user.id).is("read_at", null);
    })();

    const ch = supabase.channel(`chat-${matchId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => prev.some((m) => m.id === (payload.new as Msg).id) ? prev : [...prev, payload.new as Msg]);
          if ((payload.new as Msg).sender_id !== user.id) {
            supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", (payload.new as Msg).id);
          }
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const removed = payload.old as { id: string };
          setMessages((prev) => prev.filter((m) => m.id !== removed.id));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!loading && !user) return <Navigate to="/auth/login" />;
  if (authorized === false) return (
    <div className="min-h-screen"><Header />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        <p>Conversa não encontrada.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/conversas">Voltar</Link></Button>
      </main>
    </div>
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !input.trim()) return;
    const content = input.trim().slice(0, 2000);
    setSending(true);
    const { error } = await supabase.from("messages").insert({ match_id: matchId, sender_id: user.id, content });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setInput("");
  }

  async function handleDelete(messageId: string) {
    if (!confirm("Apagar esta mensagem? Essa ação não pode ser desfeita.")) return;
    const prev = messages;
    setMessages((m) => m.filter((x) => x.id !== messageId));
    const { error } = await supabase.from("messages").delete().eq("id", messageId);
    if (error) {
      setMessages(prev);
      toast.error("Não foi possível apagar a mensagem.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="glass mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3 shadow-soft">
        <Link to="/conversas" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
          {partner?.photo_url ? <img src={partner.photo_url} alt="" className="h-full w-full object-cover" /> :
            <div className="flex h-full w-full items-center justify-center bg-gradient-love text-sm text-white">{partner?.full_name?.charAt(0) ?? "?"}</div>}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold leading-none">{partner?.full_name?.split(" ")[0] ?? "—"}</h2>
          <p className="text-[11px] text-muted-foreground">match com propósito</p>
        </div>
      </div>

      <main ref={scrollRef} className="mx-auto w-full max-w-3xl flex-1 space-y-2 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <p className="mt-12 text-center text-sm text-muted-foreground">Comece a conversa com graça e respeito 💗</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`group flex max-w-[75%] items-end gap-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`rounded-2xl px-4 py-2 text-sm shadow-soft ${
                  mine ? "bg-gradient-love text-white" : "glass text-foreground"
                }`}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {mine && (
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    aria-label="Apagar mensagem"
                    className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 text-muted-foreground hover:text-destructive p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <form onSubmit={send} className="sticky bottom-0 border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escreva uma mensagem..." maxLength={2000} />
          <Button type="submit" disabled={sending || !input.trim()} className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}