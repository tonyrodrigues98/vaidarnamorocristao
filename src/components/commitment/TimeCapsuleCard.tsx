import { useEffect, useState } from "react";
import { Lock, Unlock, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";

import { createTimeCapsule, listTimeCapsules, openTimeCapsule } from "@/lib/timeCapsules";

type Props = {
  matchId: string;
};

export function TimeCapsuleCard({ matchId }: Props) {
  const [capsules, setCapsules] = useState<any[]>([]);

  const [message, setMessage] = useState("");

  const [unlockAt, setUnlockAt] = useState("");

  const [loading, setLoading] = useState(false);

  async function loadCapsules() {
    const data = await listTimeCapsules(matchId);

    setCapsules(data);
  }

  useEffect(() => {
    loadCapsules();
  }, [matchId]);

  async function handleCreate() {
    if (!message.trim()) return;

    if (!unlockAt) return;

    try {
      setLoading(true);

      await createTimeCapsule(matchId, message, unlockAt);

      setMessage("");
      setUnlockAt("");

      await loadCapsules();
    } finally {
      setLoading(false);
    }
  }

  async function handleOpen(capsuleId: string) {
    await openTimeCapsule(capsuleId);

    await loadCapsules();
  }

  return (
    <section className="mt-8">
      <div className="glass rounded-3xl p-6 shadow-soft">
        <div className="mb-6 flex items-center gap-2">
          <Clock3 className="h-5 w-5 text-primary" />

          <h2 className="font-semibold">Cápsula do Tempo</h2>
        </div>

        <div className="mb-6 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escreva uma mensagem para o futuro..."
            className="
              min-h-[120px]
              w-full
              rounded-2xl
              border
              bg-background
              p-4
            "
          />

          <input
            type="datetime-local"
            value={unlockAt}
            onChange={(e) => setUnlockAt(e.target.value)}
            className="
              rounded-xl
              border
              p-3
            "
          />

          <Button onClick={handleCreate} disabled={loading}>
            Criar Cápsula
          </Button>
        </div>

        <div className="space-y-4">
          {capsules.map((capsule) => {
            const unlocked = new Date(capsule.unlock_at).getTime() <= Date.now();

            const remainingDays = Math.max(
              0,
              Math.ceil((new Date(capsule.unlock_at).getTime() - Date.now()) / 86400000),
            );

            return (
              <div
                key={capsule.id}
                className="
    rounded-3xl
    border
    bg-gradient-to-br
    from-background
    to-muted/30
    p-5
    shadow-sm
  "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{unlocked ? "Cápsula Disponível" : "Cápsula Lacrada"}</p>

                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Abre em {new Date(capsule.unlock_at).toLocaleDateString("pt-BR")}
                      </p>

                      {!unlocked && (
                        <p
                          className="
        text-sm
        font-medium
        text-amber-600
      "
                        >
                          Faltam {remainingDays} dias
                        </p>
                      )}
                    </div>
                  </div>

                  {unlocked ? (
                    <Unlock className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {unlocked ? (
                  <div className="mt-4">
                    {capsule.opened_at ? (
                      <div
                        className="
                            rounded-xl
                            bg-muted
                            p-3
                            text-sm
                          "
                      >
                        {capsule.message}
                      </div>
                    ) : (
                      <Button className="mt-3" onClick={() => handleOpen(capsule.id)}>
                        Abrir Cápsula
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
