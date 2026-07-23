import { clsx, type ClassValue } from "clsx";

export function v2cx(...values: ClassValue[]): string {
  return clsx(values);
}
