import { useEffect, useState } from "react";
import {
Heart,
CheckCircle2,
Lock,
Gem,
} from "lucide-react";

import {
Card,
CardContent,
} from "@/components/ui/card";

import {
Progress,
} from "@/components/ui/progress";

import {
getCommitmentProgress,
type CommitmentProgress,
} from "@/lib/commitmentProgress";

interface CommitmentProgressCardProps {
matchId: string;
}

export function CommitmentProgressCard({
matchId,
}: CommitmentProgressCardProps) {

const [loading, setLoading] =
useState(true);

const [progress, setProgress] =
useState<CommitmentProgress | null>(
null
);

useEffect(() => {

```
let mounted = true;

async function load() {

  try {

    const data =
      await getCommitmentProgress(
        matchId
      );

    if (!mounted) return;

    setProgress(data);

  } catch (err) {

    console.error(err);

  } finally {

    if (mounted) {
      setLoading(false);
    }

  }

}

load();

return () => {
  mounted = false;
};
```

}, [matchId]);

if (loading) {
return ( <Card className="border-primary/15 bg-primary/5"> <CardContent className="p-4">
Carregando progresso... </CardContent> </Card>
);
}

if (!progress) {
return null;
}

return ( <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5"> <CardContent className="space-y-4 p-4">

```
    <div className="flex items-center gap-2">

      <div className="rounded-full bg-primary/10 p-2">
        <Heart className="h-5 w-5 text-primary" />
      </div>

      <div>
        <h3 className="font-semibold">
          Caminho para Firmar Propósito
        </h3>

        <p className="text-xs text-muted-foreground">
          Construam uma conexão antes do compromisso.
        </p>
      </div>

    </div>

    <Progress
      value={progress.percentage}
    />

    <p className="text-sm font-medium">
      {progress.percentage}% concluído
    </p>

    <div className="space-y-2">

      <Requirement
        done={
          progress.requirements
            .hasMatch
        }
        label="Match realizado"
      />

      <Requirement
        done={
          progress.requirements
            .threeConversationDays
        }
        label="3 dias de conversa"
      />

      <Requirement
        done={
          progress.requirements
            .twentyMessagesEach
        }
        label="20 mensagens de cada lado"
      />

    </div>

    {progress.canCommit ? (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">

        <div className="flex items-center gap-2">

          <Gem className="h-4 w-4 text-emerald-600" />

          <span className="text-sm font-semibold text-emerald-700">
            Prontos para firmar propósito
          </span>

        </div>

      </div>
    ) : (
      <div className="rounded-xl border border-border bg-muted/30 p-3">

        <div className="flex items-center gap-2">

          <Lock className="h-4 w-4 text-muted-foreground" />

          <span className="text-sm text-muted-foreground">
            Continue conversando para desbloquear.
          </span>

        </div>

      </div>
    )}

  </CardContent>
</Card>
```

);
}

function Requirement({
done,
label,
}: {
done: boolean;
label: string;
}) {
return ( <div className="flex items-center gap-2">

```
  <CheckCircle2
    className={
      done
        ? "h-4 w-4 text-emerald-500"
        : "h-4 w-4 text-muted-foreground"
    }
  />

  <span
    className={
      done
        ? "text-sm"
        : "text-sm text-muted-foreground"
    }
  >
    {label}
  </span>

</div>
```

);
}

