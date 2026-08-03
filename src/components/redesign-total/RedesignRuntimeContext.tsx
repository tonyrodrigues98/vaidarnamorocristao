/* eslint-disable react-refresh/only-export-components -- runtime provider and hook are one contract */
import { createContext, useContext, type ReactNode } from "react";

export type RedesignRuntimeValue = {
  active: boolean;
};

const defaultValue: RedesignRuntimeValue = { active: false };

const RedesignRuntimeContext = createContext<RedesignRuntimeValue>(defaultValue);

export function RedesignRuntimeProvider({
  active,
  children,
}: RedesignRuntimeValue & { children: ReactNode }) {
  return (
    <RedesignRuntimeContext.Provider value={{ active }}>{children}</RedesignRuntimeContext.Provider>
  );
}

export function useRedesignRuntime(): RedesignRuntimeValue {
  return useContext(RedesignRuntimeContext);
}
