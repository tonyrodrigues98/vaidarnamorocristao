export type AccountStatus = "pending" | "approved" | "rejected" | "banned";

export type NativeAdminWarning = {
  id: string;
  message: string;
  severity: "amber" | "severe";
};

export type NativeAdminRequest = {
  id: string;
  kind: "photo" | "bio" | "behavior" | "other";
  message: string;
  createdAt: string;
};

export type NativeAppeal = {
  appealText: string;
  status: "pending" | "answered" | "ignored";
  responseText: string | null;
  createdAt: string;
};

export type NativeInicioViewModel = {
  status: AccountStatus;
  firstName: string;
  greeting: string;
  greetingDetail: string;
  bannedReason: string | null;
  rejectionReason: string | null;
  warnings: NativeAdminWarning[];
  requests: NativeAdminRequest[];
  latestAppeal: NativeAppeal | null;
  latestRejectionAppeal: NativeAppeal | null;
  canAppeal: boolean;
  canReverify: boolean;
  appealText: string;
  appealBusy: boolean;
  devotional: {
    title: string;
    bibleReference: string | null;
    bibleText: string | null;
  } | null;
  strength: number;
  strengthLabel: string;
  nextProfileAction: { title: string; description: string } | null;
  unreadConversations: number;
  newProfiles: number;
  suggestion: {
    id: string;
    firstName: string;
    age: number | null;
    location: string | null;
  } | null;
  commitment: { matchId: string; partnerName: string | null; days: number } | null;
  onAppealTextChange(value: string): void;
  onAcknowledgeWarning(id: string): void;
  onResolveRequest(id: string): void;
  onSubmitAppeal(kind: "ban" | "rejection"): void;
};

export type NativePriority = {
  eyebrow: string;
  title: string;
  description: string;
  to: string;
  progress?: number;
};

export function getNativeInicioPriority(model: NativeInicioViewModel): NativePriority {
  if (model.status === "banned") {
    return {
      eyebrow: "Conta suspensa",
      title: "Acompanhe sua situação com a equipe",
      description: "Consulte o suporte ou envie uma apelação usando o formulário desta página.",
      to: "/suporte",
    };
  }
  if (model.status === "rejected") {
    return {
      eyebrow: "Perfil precisa de revisão",
      title: "Revise as informações do seu perfil",
      description: "Faça os ajustes solicitados antes de pedir uma nova análise.",
      to: "/perfil",
    };
  }
  if (model.warnings.some((warning) => warning.severity === "severe")) {
    return {
      eyebrow: "Moderação",
      title: "Leia o aviso importante da equipe",
      description: "O aviso e a ação de reconhecimento estão disponíveis abaixo.",
      to: "/suporte",
    };
  }
  if (model.requests.length > 0) {
    const request = model.requests[0];
    return {
      eyebrow: "Solicitação da equipe",
      title: "Há uma solicitação esperando sua atenção",
      description: request.message,
      to: request.kind === "photo" || request.kind === "bio" ? "/perfil" : "/suporte",
    };
  }
  if (model.status === "pending") {
    return {
      eyebrow: "Perfil em análise",
      title: "Acompanhe a aprovação do seu perfil",
      description: "Sua conta permanece em análise pela equipe.",
      to: "/perfil",
    };
  }
  if (model.commitment) {
    return {
      eyebrow: "Propósito ativo",
      title: model.commitment.partnerName
        ? `Continue seu propósito com ${model.commitment.partnerName}`
        : "Continue seu propósito",
      description: `Vocês estão caminhando há ${model.commitment.days} ${
        model.commitment.days === 1 ? "dia" : "dias"
      }.`,
      to: `/proposito/${model.commitment.matchId}`,
    };
  }
  if (model.strength < 100 && model.nextProfileAction) {
    return {
      eyebrow: "Perfil",
      title: model.nextProfileAction.title,
      description: model.nextProfileAction.description,
      to: "/perfil",
      progress: model.strength,
    };
  }
  if (model.devotional) {
    return {
      eyebrow: "Palavra do dia",
      title: "Reserve um momento para o devocional",
      description: model.devotional.title,
      to: "/devocional",
    };
  }
  return {
    eyebrow: "Sua jornada",
    title: "Veja o que está acontecendo na comunidade",
    description: "Continue pelas áreas reais disponíveis no aplicativo.",
    to: "/comunidade",
  };
}
