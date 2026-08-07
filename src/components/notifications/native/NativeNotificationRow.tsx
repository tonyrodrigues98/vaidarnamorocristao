import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, useAnimation, useMotionValue, type PanInfo } from "framer-motion";
import { Bell, Trash2 } from "lucide-react";

import type { AppNotification } from "@/lib/notifications";
import { stripNotificationEmoji } from "@/lib/notification-presentation";

export type NativeNotificationRowProps = {
  notification: AppNotification;
  onOpen(notification: AppNotification): void;
  onDelete(notification: AppNotification): void;
};

export function NativeNotificationRow({
  notification,
  onOpen,
  onDelete,
}: NativeNotificationRowProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const actionWidth = 96;

  const snapTo = (target: number) =>
    controls.start({
      x: target,
      transition: { type: "spring", stiffness: 500, damping: 40, mass: 0.6 },
    });

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.velocity.x < -900 || x.get() < -actionWidth * 1.6) {
      onDelete(notification);
      return;
    }
    void snapTo(x.get() < -actionWidth / 2 || info.velocity.x < -350 ? -actionWidth : 0);
  };

  const handleOpen = () => {
    if (x.get() < -8) {
      void snapTo(0);
      return;
    }
    onOpen(notification);
  };

  return (
    <motion.li layout className="relative overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => onDelete(notification)}
        aria-label="Apagar notificação"
        className="absolute inset-y-0 right-0 flex min-h-11 w-24 items-center justify-center bg-destructive text-destructive-foreground"
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
      </button>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -actionWidth * 1.8, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className={
          notification.read_at
            ? "relative flex items-start gap-3 bg-card p-4"
            : "relative flex items-start gap-3 bg-primary/5 p-4"
        }
      >
        <button
          type="button"
          onClick={handleOpen}
          className="flex min-h-11 min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-primary">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block break-words font-medium text-foreground">
              {stripNotificationEmoji(notification.title)}
            </span>
            {notification.body ? (
              <span className="mt-1 block break-words text-sm text-muted-foreground">
                {stripNotificationEmoji(notification.body)}
              </span>
            ) : null}
            {notification.image_url ? (
              <img
                src={notification.image_url}
                alt="Imagem anexada à notificação"
                loading="lazy"
                className="mt-3 h-24 w-24 rounded-xl border border-border object-cover"
              />
            ) : null}
            <span className="mt-1 block text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(notification)}
          className="hidden min-h-11 min-w-11 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid"
          aria-label="Remover notificação"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </motion.div>
    </motion.li>
  );
}
