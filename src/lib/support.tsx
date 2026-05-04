import type { ReactNode } from "react";

export type Ticket = {
  id: string;
  user_id: string;
  title: string;
  category: "account" | "payments" | "profile" | "matches" | "community" | "technical" | "security" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_review" | "awaiting_user" | "resolved" | "closed";
  assigned_to: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  attachments: { path: string; name: string; type: string; size: number }[];
  is_staff: boolean;
  created_at: string;
};

export const CATEGORIES: { value: Ticket["category"]; label: string }[] = [
  { value: "account", label: "Conta" },
  { value: "payments", label: "Pagamentos" },
  { value: "profile", label: "Perfil" },
  { value: "matches", label: "Matches e Conversas" },
  { value: "community", label: "Comunidade" },
  { value: "technical", label: "Problemas técnicos" },
  { value: "security", label: "Segurança" },
  { value: "other", label: "Outros" },
];

export const PRIORITIES: { value: Ticket["priority"]; label: string }[] = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" },
];

export const STATUSES: { value: Ticket["status"]; label: string }[] = [
  { value: "open", label: "Aberto" },
  { value: "in_review", label: "Em análise" },
  { value: "awaiting_user", label: "Aguardando você" },
  { value: "resolved", label: "Resolvido" },
  { value: "closed", label: "Fechado" },
];

export function statusBadge(s: Ticket["status"]): ReactNode {
  const map: Record<Ticket["status"], { label: string; className: string }> = {
    open: { label: "Aberto", className: "bg-sky-500/15 text-sky-500" },
    in_review: { label: "Em análise", className: "bg-amber-500/15 text-amber-500" },
    awaiting_user: { label: "Aguardando", className: "bg-violet-500/15 text-violet-500" },
    resolved: { label: "Resolvido", className: "bg-emerald-500/15 text-emerald-500" },
    closed: { label: "Fechado", className: "bg-muted text-muted-foreground" },
  };
  const m = map[s];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${m.className}`}>{m.label}</span>;
}

export function priorityBadge(p: Ticket["priority"]): ReactNode {
  const map: Record<Ticket["priority"], { label: string; className: string }> = {
    low: { label: "Baixa", className: "border border-border text-muted-foreground" },
    medium: { label: "Média", className: "border border-sky-500/40 text-sky-500" },
    high: { label: "Alta", className: "border border-amber-500/40 text-amber-500" },
    urgent: { label: "Urgente", className: "border border-destructive/60 text-destructive animate-pulse" },
  };
  const m = map[p];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${m.className}`}>{m.label}</span>;
}