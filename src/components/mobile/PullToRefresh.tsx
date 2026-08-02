import type { ReactNode } from "react";

import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/mobile/PullToRefreshIndicator";

type Props = {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
  children: ReactNode;
};

/**
 * Drop-in wrapper that attaches a native-feel pull-to-refresh gesture and
 * renders a small floating indicator. Layout-neutral: it does not introduce
 * any extra DOM wrapper around children.
 */
export function PullToRefresh({ onRefresh, disabled, children }: Props) {
  const { pullDistance, isPulling, isRefreshing, threshold } = usePullToRefresh({
    onRefresh,
    disabled,
  });
  return (
    <>
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        threshold={threshold}
      />
      {children}
    </>
  );
}
