export type Ticket = {
  id: string;
  user_id: string;
  title: string;
  category:
    | "account"
    | "payments"
    | "profile"
    | "matches"
    | "community"
    | "technical"
    | "security"
    | "other";
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
