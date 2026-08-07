import type { ReactNode } from "react";

import { Prototype01RuntimeContext } from "./Prototype01RuntimeContext";

export function Prototype01RuntimeProvider({ children }: { children: ReactNode }) {
  return <Prototype01RuntimeContext.Provider value>{children}</Prototype01RuntimeContext.Provider>;
}
