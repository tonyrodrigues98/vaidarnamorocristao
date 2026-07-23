import { CalendarPlus, Clapperboard, HelpCircle, MessageSquareText, PenLine } from "lucide-react";
import type { RefObject } from "react";
import { V2StatusBadge, V2Text } from "@/v2/design-system";
import type { V2CreateAction } from "./types";
import { V2ShellOverlaySurface } from "./V2ShellOverlaySurface";

export const V2_CREATE_ACTIONS = Object.freeze([
  {
    id: "post",
    label: "Criar publicação",
    description: "Compartilhe uma novidade com a comunidade.",
    icon: PenLine,
  },
  {
    id: "reflection",
    label: "Compartilhar reflexão",
    description: "Escreva algo que edificou sua caminhada.",
    icon: MessageSquareText,
  },
  {
    id: "question",
    label: "Fazer uma pergunta",
    description: "Convide pessoas para uma conversa respeitosa.",
    icon: HelpCircle,
  },
  {
    id: "event",
    label: "Criar evento",
    description: "Organize um encontro ou atividade comunitária.",
    icon: CalendarPlus,
  },
  {
    id: "cinema",
    label: "Iniciar Sala de Cinema",
    description: "Prepare uma futura sessão para assistir juntos.",
    icon: Clapperboard,
  },
] satisfies readonly V2CreateAction[]);

export interface V2CreateSheetProps {
  readonly open: boolean;
  readonly returnFocusRef: RefObject<HTMLElement | null>;
  readonly onClose: () => void;
  readonly onSelect?: (action: V2CreateAction) => void;
}

export function V2CreateSheet({ open, returnFocusRef, onClose, onSelect }: V2CreateSheetProps) {
  return (
    <V2ShellOverlaySurface
      id="vdn-v2-create-sheet"
      open={open}
      title="O que você quer criar?"
      description="Ações demonstrativas — nada será publicado nesta etapa."
      presentation="sheet"
      returnFocusRef={returnFocusRef}
      onClose={onClose}
    >
      <div className="vdn-v2-shell-create-grid">
        {V2_CREATE_ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              className="vdn-v2-shell-create-action"
              data-vdn-v2-autofocus={index === 0 ? "" : undefined}
              onClick={() => {
                onSelect?.(action);
                onClose();
              }}
            >
              <span className="vdn-v2-shell-create-action__icon" aria-hidden="true">
                <Icon />
              </span>
              <span>
                <strong>{action.label}</strong>
                <V2Text as="span" variant="caption" tone="muted">
                  {action.description}
                </V2Text>
              </span>
              {action.id === "cinema" ? <V2StatusBadge tone="info">Em breve</V2StatusBadge> : null}
            </button>
          );
        })}
      </div>
    </V2ShellOverlaySurface>
  );
}
