import { useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PetCareKind } from "@/types/petCare";
import type { UserPetV2Full } from "@/types/petCatalog";

import { MapBackground } from "./MapBackground";
import { MapClouds } from "./MapClouds";
import { KingdomHUD } from "./KingdomHUD";
import { RegionHotspot } from "./RegionHotspot";
import { ExpeditionsCard } from "./ExpeditionsCard";
import { PetWeeklyChestCard } from "./PetWeeklyChestCard";
import { PetCaixasEntryCard } from "./grab/PetCaixasEntryCard";

type SheetKind = null | "expeditions" | "caixas" | "weekly";

type Props = {
  pet: UserPetV2Full;
  petImage: string | null;
  careValues: Partial<Record<PetCareKind, number>>;
  isAway: boolean;
  xpRefresh: number;
  streakDays: number;
  missionsDoneToday: number;
  babyImage: string | null;
  adultImage: string | null;
  onCareAction: (k: PetCareKind) => void;
  onCareChanged: () => void;
  onEvolved: () => void;
  onBackToRoom: () => void;
  onOpenConstellation: () => void;
};

/**
 * Mapa do Reino (Z2) — **Mundo externo**: ações que tiram o pet do quarto.
 * 4 regiões úteis + a Casa central (volta pro quarto):
 * - Floresta = Expedições
 * - Mercado (Vale) = Vitrine de caixas
 * - Lago = Quiz Bíblico do dia
 * - Torre = Caixa semanal
 *
 * Dia-a-dia (cuidado, missões, streak, diário) fica no Quarto (Z1).
 * Memória (evolução, progressão, histórico) fica na Constelação (Z3).
 */
export function PetKingdomMap({
  pet,
  isAway,
  xpRefresh,
  streakDays,
  missionsDoneToday,
  onCareChanged,
  onBackToRoom,
  onOpenConstellation,
}: Props) {
  const [sheet, setSheet] = useState<SheetKind>(null);

  // Sinais de atenção por região — a paisagem inteira "respira" sem texto.
  const forestAttention: 0 | 1 | 2 = isAway ? 2 : 1;
  const valleyAttention: 0 | 1 | 2 = 1;
  const lakeAttention: 0 | 1 | 2 = 1;
  const towerAttention: 0 | 1 | 2 = missionsDoneToday >= 3 ? 2 : 1;

  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={300}>
      <section
        className="relative h-full w-full overflow-hidden bg-neutral-950"
        aria-label="Mapa do reino"
      >
        <div className="relative h-full w-full">
          <MapBackground />
          <MapClouds />

          <KingdomHUD
            petName={pet.custom_name}
            streakDays={streakDays}
            level={null}
            onBack={onBackToRoom}
            onOpenConstellation={onOpenConstellation}
          />

          {/* CASA — volta pro quarto */}
          <RegionHotspot
            x={48} y={62} radius={9}
            label="Casa"
            tooltip="Voltar pro Quarto · cuidado do dia-a-dia."
            labelPlacement="bottom"
            attention={0}
            onClick={onBackToRoom}
          />

          {/* FLORESTA — expedições */}
          <RegionHotspot
            x={18} y={42} radius={10}
            label="Floresta"
            tooltip="Mundo · enviar o pet em expedição pra trazer recompensas."
            labelPlacement="bottom"
            attention={forestAttention}
            onClick={() => setSheet("expeditions")}
          />

          {/* MERCADO — caixas */}
          <RegionHotspot
            x={76} y={38} radius={11}
            label="Mercado"
            tooltip="Mundo · abrir caixas surpresa com itens raros."
            labelPlacement="bottom"
            attention={valleyAttention}
            onClick={() => setSheet("caixas")}
          />

          {/* LAGO — quiz */}
          <RegionHotspot
            x={22} y={80} radius={10}
            label="Lago"
            tooltip="Mundo · responder o Quiz Bíblico do dia."
            labelPlacement="top"
            attention={lakeAttention}
            onClick={() => { window.location.assign("/quiz-biblico"); }}
          />

          {/* TORRE — caixa semanal */}
          <RegionHotspot
            x={80} y={75} radius={10}
            label="Torre"
            tooltip="Mundo · caixa semanal que enche conforme você completa missões."
            labelPlacement="top"
            attention={towerAttention}
            onClick={() => setSheet("weekly")}
          />
        </div>

        <KingdomSheet
          open={sheet === "expeditions"}
          onClose={() => setSheet(null)}
          title="Floresta das Expedições"
          description="A trilha leva pra fora do reino."
        >
          <ExpeditionsCard
            userPetId={pet.id}
            petImage={null}
            petName={pet.custom_name}
            onChanged={onCareChanged}
          />
        </KingdomSheet>

        <KingdomSheet
          open={sheet === "caixas"}
          onClose={() => setSheet(null)}
          title="Mercado de Caixas"
          description="Caixas surpresa com pets, itens e raridades."
        >
          <PetCaixasEntryCard />
        </KingdomSheet>

        <KingdomSheet
          open={sheet === "weekly"}
          onClose={() => setSheet(null)}
          title="Torre do Tesouro"
          description="A caixa semanal recheia a cada missão concluída."
        >
          <PetWeeklyChestCard refreshKey={xpRefresh} onClaimed={onCareChanged} />
        </KingdomSheet>
      </section>
    </TooltipProvider>
  );
}

function KingdomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}