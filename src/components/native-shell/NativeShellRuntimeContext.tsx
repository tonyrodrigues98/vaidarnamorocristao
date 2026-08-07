/* eslint-disable react-refresh/only-export-components -- provider and hook are one local runtime contract */
import { createContext, useContext, type ReactNode } from "react";

import type { FuturePrimaryTab } from "@/config/app-destinations";

export type NativeShellRuntimeContextValue = {
  active: boolean;
  activeTab?: FuturePrimaryTab;
};

const defaultNativeShellRuntime: NativeShellRuntimeContextValue = {
  active: false,
  activeTab: undefined,
};

const NativeShellRuntimeContext =
  createContext<NativeShellRuntimeContextValue>(defaultNativeShellRuntime);

export type NativeShellRuntimeProviderProps = NativeShellRuntimeContextValue & {
  children: ReactNode;
};

export function NativeShellRuntimeProvider({
  active,
  activeTab,
  children,
}: NativeShellRuntimeProviderProps) {
  return (
    <NativeShellRuntimeContext.Provider value={{ active, activeTab }}>
      {children}
    </NativeShellRuntimeContext.Provider>
  );
}

export function useNativeShellRuntime(): NativeShellRuntimeContextValue {
  return useContext(NativeShellRuntimeContext);
}
