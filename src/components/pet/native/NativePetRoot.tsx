import type { ReactNode } from "react";

import "@/styles/native-pet.css";

export type NativePetRootProps = {
  children: ReactNode;
};

export function NativePetRoot({ children }: NativePetRootProps) {
  return (
    <main
      data-vdn-native-pet
      className="mx-auto w-full max-w-5xl px-4 py-6 text-foreground sm:px-6 sm:py-8"
    >
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Meu Pet</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Cuide do seu companheiro, acompanhe seu progresso e continue suas aventuras.
        </p>
      </header>
      {children}
    </main>
  );
}
