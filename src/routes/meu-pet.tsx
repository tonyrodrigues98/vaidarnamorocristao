import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, PawPrint, Pencil, Sparkles } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  claimPet,
  equipPet,
  getEquippedPet,
  listActivePets,
  listMyPets,
  renamePet,
} from "@/lib/pets";
import {
  PET_RARITY_COLOR,
  PET_RARITY_LABEL,
  type Pet,
  type UserPetWithPet,
} from "@/types/pet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/meu-pet")({ component: MeuPetPage });

function MeuPetPage() {
  const { user, loading } = useAuth();
  const [catalog, setCatalog] = useState<Pet[]>([]);
  const [mine, setMine] = useState<UserPetWithPet[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloading, setReloading] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const equipped = useMemo(() => mine.find((m) => m.is_equipped) ?? null, [mine]);

  async function reload(uid: string) {
    setReloading(true);
    try {
      const [c, m] = await Promise.all([listActivePets(), listMyPets(uid)]);
      setCatalog(c);
      setMine(m);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReloading(false);
    }
  }

  useEffect(() => {
    if (user) void reload(user.id);
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" />;

  async function choose(pet: Pet) {
    if (!user) return;
    setBusyId(pet.id);
    try {
      let userPet = mine.find((m) => m.pet_id === pet.id);
      if (!userPet) {
        const created = await claimPet(pet.id);
        userPet = { ...created, pet };
      }
      await equipPet(userPet.id);
      toast.success(`${pet.name} equipado!`);
      await reload(user.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function saveRename() {
    if (!equipped || !user) return;
    try {
      await renamePet(equipped.id, renameValue);
      setRenaming(false);
      toast.success("Nome atualizado");
      await reload(user.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-primary" />
          <h1 className="font-serif text-2xl font-semibold text-foreground">Meu pet</h1>
        </div>

        {/* Showcase */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-white to-[#FFEFE7] p-6 shadow-sm">
          {equipped ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-stretch">
              <div className="flex h-60 w-60 shrink-0 items-center justify-center rounded-2xl bg-white/60">
                {equipped.pet.image_url ? (
                  <img
                    src={equipped.pet.image_url}
                    alt={equipped.pet.name}
                    className="max-h-full max-w-full object-contain drop-shadow-md"
                  />
                ) : (
                  <PawPrint className="h-20 w-20 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      PET_RARITY_COLOR[equipped.pet.rarity],
                    )}
                  >
                    {PET_RARITY_LABEL[equipped.pet.rarity]}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {equipped.pet.species}
                  </span>
                </div>
                {renaming ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      autoFocus
                      maxLength={30}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      placeholder={equipped.pet.name}
                    />
                    <Button size="sm" onClick={() => void saveRename()}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setRenameValue(equipped.custom_name ?? "");
                      setRenaming(true);
                    }}
                    className="group mt-2 inline-flex items-center gap-2 text-left"
                  >
                    <h2 className="font-serif text-2xl font-semibold text-foreground">
                      {equipped.custom_name || equipped.pet.name}
                    </h2>
                    <Pencil className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </button>
                )}
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {equipped.pet.description ?? "Seu companheiro escolhido."}
                </p>
                <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Aparece no seu perfil
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <PawPrint className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Você ainda não tem um pet. Escolha um abaixo — é grátis!
              </p>
            </div>
          )}
        </section>

        {/* Catalog */}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Escolha seu pet
          </h3>
          {reloading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {catalog.map((pet) => {
                const owned = mine.find((m) => m.pet_id === pet.id);
                const isEquipped = owned?.is_equipped ?? false;
                return (
                  <div
                    key={pet.id}
                    className={cn(
                      "flex flex-col rounded-2xl border bg-card p-3 shadow-sm transition",
                      isEquipped ? "border-primary ring-2 ring-primary/30" : "border-border",
                    )}
                  >
                    <div className="flex h-32 items-center justify-center rounded-xl bg-muted/40">
                      {pet.image_url ? (
                        <img
                          src={pet.image_url}
                          alt={pet.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <PawPrint className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{pet.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                          PET_RARITY_COLOR[pet.rarity],
                        )}
                      >
                        {PET_RARITY_LABEL[pet.rarity]}
                      </span>
                    </div>
                    <p className="line-clamp-2 mt-1 text-xs text-muted-foreground">
                      {pet.description ?? pet.species}
                    </p>
                    <Button
                      size="sm"
                      variant={isEquipped ? "secondary" : "default"}
                      className="mt-3 w-full"
                      disabled={isEquipped || busyId === pet.id}
                      onClick={() => void choose(pet)}
                    >
                      {busyId === pet.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isEquipped ? (
                        "Equipado"
                      ) : owned ? (
                        "Equipar"
                      ) : (
                        "Escolher"
                      )}
                    </Button>
                  </div>
                );
              })}
              {catalog.length === 0 && (
                <div className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Nenhum pet disponível no momento.
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}