import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Top header content (route Header + chat header bar). */
  header: ReactNode;
  /** Optional pinned region rendered above the scrollable messages area. */
  pinned?: ReactNode;
  /** Scrollable messages area. Only this region scrolls. */
  messages: ReactNode;
  /** Composer pinned to the bottom (sits flush against the keyboard). */
  composer: ReactNode;
  /** Floating elements (sheets, dialogs, overlays). */
  overlays?: ReactNode;
  className?: string;
};

/**
 * Shared mobile chat shell used by /comunidade and /conversas/$matchId.
 * Uses the visual-viewport-driven `--app-visual-height` so the composer stays
 * flush to the on-screen keyboard with no extra whitespace.
 */
export const MobileChatScreen = forwardRef<HTMLDivElement, Props>(function MobileChatScreen(
  { header, pinned, messages, composer, overlays, className },
  scrollRef,
) {
  return (
    <div className={cn("mobile-chat-screen flex h-full w-full flex-col bg-background", className)}>
      {header}
      {pinned}
      <div
        ref={scrollRef}
        className="mobile-chat-scroll min-h-0 w-full flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 md:space-y-5 md:px-4 md:py-6">
          {messages}
        </div>
      </div>
      {composer}
      {overlays}
    </div>
  );
});