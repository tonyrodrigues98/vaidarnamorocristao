/**
 * Skeleton específico do bloco principal do /meu-pet.
 * Espelha o layout final (HUD, arte e info) para evitar o "salto" visual
 * quando a query do pet ainda está carregando.
 */
export function PetShowcaseSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_0_rgba(0,0,0,0.02),0_24px_60px_-30px_rgba(0,0,0,0.12)]">
        <div className="hidden border-b border-neutral-100 bg-neutral-50/60 p-4 sm:block">
          <div className="mb-3 h-3 w-40 rounded bg-neutral-200" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-9 rounded-xl bg-neutral-100" />
            ))}
          </div>
        </div>
        <div className="grid gap-0 sm:grid-cols-[260px_1fr]">
          <div className="relative flex flex-col items-stretch justify-center overflow-hidden border-b border-neutral-100 bg-gradient-to-b from-neutral-50 to-white pt-4 sm:border-b-0 sm:border-r sm:pt-6">
            <div className="mb-3 px-4 sm:hidden">
              <div className="mb-2 h-3 w-32 rounded bg-neutral-200" />
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg bg-neutral-100" />
                ))}
              </div>
            </div>
            <div className="flex min-h-[240px] flex-1 items-center justify-center">
              <div className="size-40 rounded-full bg-gradient-to-b from-neutral-100 to-neutral-50" />
            </div>
            <div className="mt-2 flex items-center justify-center px-4 pb-4 sm:pb-6">
              <div className="h-3 w-44 rounded bg-neutral-100" />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="h-8 w-44 rounded bg-neutral-200" />
            <div className="flex flex-wrap gap-1.5">
              <div className="h-6 w-16 rounded-full bg-neutral-100" />
              <div className="h-6 w-20 rounded-full bg-neutral-100" />
              <div className="h-6 w-24 rounded-full bg-neutral-100" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="h-7 w-24 rounded-full bg-neutral-100" />
              <div className="h-7 w-24 rounded-full bg-neutral-900/80" />
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-100 bg-white p-3 sm:p-4">
          <div className="h-16 w-full rounded-2xl bg-sky-50" />
        </div>
      </section>
      <div className="h-24 w-full rounded-2xl border border-neutral-200 bg-white" />
      <div className="h-14 w-full rounded-2xl border border-neutral-200 bg-white" />
    </div>
  );
}
