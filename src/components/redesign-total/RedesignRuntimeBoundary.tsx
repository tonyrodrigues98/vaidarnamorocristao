import type { ReactNode } from "react";

import {
  shouldActivateTotalRedesign,
  totalRedesignFeatureEnabled,
} from "@/config/redesign-total-feature";

import { RedesignRuntimeProvider } from "./RedesignRuntimeContext";

export type RedesignRuntimeBoundaryProps = {
  nativeShellActive: boolean;
  children: ReactNode;
};

export function RedesignRuntimeBoundary({
  nativeShellActive,
  children,
}: RedesignRuntimeBoundaryProps) {
  const active = shouldActivateTotalRedesign(nativeShellActive, totalRedesignFeatureEnabled);

  return <RedesignRuntimeProvider active={active}>{children}</RedesignRuntimeProvider>;
}
