/* eslint-disable react-refresh/only-export-components -- provider and hook form one runtime contract */
import { createContext, useContext, type ReactNode } from "react";

import type { AppRole } from "@/lib/roles";

export type AdminShellRuntimeValue = {
  active: boolean;
  destinationId?: string;
  pathname?: string;
  role?: AppRole;
};

const defaultValue: AdminShellRuntimeValue = { active: false };
const AdminShellRuntimeContext = createContext<AdminShellRuntimeValue>(defaultValue);

export function AdminShellRuntimeProvider({
  value,
  children,
}: {
  value: AdminShellRuntimeValue;
  children: ReactNode;
}) {
  return (
    <AdminShellRuntimeContext.Provider value={value}>{children}</AdminShellRuntimeContext.Provider>
  );
}

export function useAdminShellRuntime(): AdminShellRuntimeValue {
  return useContext(AdminShellRuntimeContext);
}
