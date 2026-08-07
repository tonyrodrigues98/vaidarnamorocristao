import { createContext, useContext } from "react";

export const Prototype01RuntimeContext = createContext(false);

export function usePrototype01Runtime(): boolean {
  return useContext(Prototype01RuntimeContext);
}
