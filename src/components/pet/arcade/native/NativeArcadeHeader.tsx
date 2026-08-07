import { CoinIcon } from "@/components/icons/CoinIcon";
import { PetImg } from "@/components/pet/PetImg";

export type NativeArcadeHeaderProps = {
  balance: number;
  petName?: string;
  petImage?: string | null;
  careScore: number;
  usedToday?: number;
  dailyLimit?: number;
};

export function NativeArcadeHeader({
  balance,
  petName,
  petImage,
  careScore,
  usedToday,
  dailyLimit,
}: NativeArcadeHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Arcade</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aventuras com Moedas internas, progressão e cuidado do seu pet.
        </p>
        {usedToday !== undefined && dailyLimit !== undefined ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Partidas hoje: {usedToday}/{dailyLimit}
          </p>
        ) : null}
      </div>
      <div className="flex min-h-11 items-center gap-3 rounded-2xl border border-border bg-card px-3 py-2">
        {petImage ? (
          <PetImg src={petImage} alt={petName ?? "Pet"} className="h-11 w-11 object-contain" />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{petName ?? "Seu pet"}</p>
          <p className="text-xs text-muted-foreground">Cuidado {careScore}%</p>
        </div>
        <span className="ml-2 inline-flex items-center gap-1 font-semibold text-foreground">
          <CoinIcon className="h-5 w-5" aria-hidden="true" /> {balance}
        </span>
      </div>
    </header>
  );
}
