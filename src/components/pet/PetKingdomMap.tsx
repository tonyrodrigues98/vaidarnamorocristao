import { useMemo, useState, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { PetCareKind } from "@/types/petCare";
import type { UserPetV2Full } from "@/types/petCatalog";

import { MapBackground } from "./MapBackground";
import { MapClouds } from "./MapClouds";
import { KingdomHUD } from "./KingdomHUD";
import { RegionHotspot } from "./RegionHotspot";
import { MissionsTodayCard } from "./MissionsTodayCard";
import { ExpeditionsCard } from "./ExpeditionsCard";
import { PetEvolutionCard } from "./PetEvolutionCard";

type SheetKind = null | "missions" | "expeditions" | "evolution";

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
};

/**
 * Mapa do Reino (Z2). Zoom-out cinematográfico do Quarto Vivo.
 * 5 regiões: Casa (volta pro quarto), Floresta (expedições),
 * Vale (missões), Lago (dormir), Torre (evolução).
 */
export function PetKingdomMap({
  pet,
  careValues,
  isAway,
  xpRefresh,
  streakDays,
  missionsDoneToday,
  babyImage,
  adultImage,
  onCareAction,
  onCareChanged,
  onEvolved,
  onBackToRoom,
}: Props) {
  const [sheet, setSheet] = useState<SheetKind>(null);

  // Sinais de atenção por região — a paisagem inteira "respira" sem texto.
  const forestAttention = isAway ? 2 : 1; // expedição em curso = urgente
  const valleyAttention: 0 | 1 | 2 = missionsDoneToday >= 3 ? 0 : 2;
  const lakeAttention: 0 | 1 | 2 = (careValues.sleep ?? 100) < 40 ? 2 : 1;
  const towerAttention: 0 | 1 | 2 = 1;

  return (
    <section
      className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl border border-neutral-200/80 bg-amber-50/40 shadow-[0_2px_0_rgba(0,0,0,0.02),0_30px_70px_-35px_rgba(0,0,0,0.18)]"
      aria-label="Mapa do reino"
    >
      <div className="relative aspect-[2/3] w-full">
        <MapBackground />
        <MapClouds />

        <KingdomHUD
          petName={pet.custom_name}
          streakDays={streakDays}
          level={null}
          onBack={onBackToRoom}
        />

        {/* CASA — volta pro quarto */}
        <RegionHotspot
          x={32} y={50} width={32} height={26}
          label="Casa do pet — voltar pro quarto"
          attention={0}
          onClick={onBackToRoom}
        />

        {/* FLORESTA — expedições */}
        <RegionHotspot
          x={1} y={32} width={34} height={28}
          label="Floresta das Expedições"
          attention={forestAttention}
          onClick={() => setSheet("expeditions")}
        />

        {/* VALE — missões */}
        <RegionHotspot
          x={54} y={26} width={45} height={30}
          label="Vale das Missões"
          attention={valleyAttention}
          onClick={() => setSheet("missions")}
        />

        {/* LAGO — dormir */}
        <RegionHotspot
          x={2} y={70} width={42} height={24}
          label="Lago do Descanso"
          attention={lakeAttention}
          onClick={() => onCareAction("sleep")}
        />

        {/* TORRE — evolução */}
        <RegionHotspot
          x={65} y={56} width={32} height={32}
          label="Torre da Evolução"
          attention={towerAttention}
          onClick={() => setSheet("evolution")}
        />
      </div>

      {/* SHEETS reusam os cards existentes */}
      <KingdomSheet
        open={sheet === "missions"}
        onClose={() => setSheet(null)}
        title="Vale das Missões"
        description="Pergaminhos com tarefas do dia flutuam sobre o trigo."
      >
        <MissionsTodayCard refreshKey={xpRefresh} onCompletedChange={onCareChanged} />
      </KingdomSheet>

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
        open={sheet === "evolution"}
        onClose={() => setSheet(null)}
        title="Torre da Evolução"
        description="O caminho do pet é guardado no alto da torre."
      >
        <PetEvolutionCard
          refreshKey={xpRefresh}
          petName={pet.custom_name}
          babyImage={babyImage}
          adultImage={adultImage}
          onEvolved={onEvolved}
        />
      </KingdomSheet>
    </section>
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