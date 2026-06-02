import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth";

import {
getActiveCommitmentByUser,
} from "@/lib/commitments";

export function useActiveCommitment() {

const { user } = useAuth();

const [loading, setLoading] =
useState(true);

const [commitment, setCommitment] =
useState<any>(null);

useEffect(() => {

```
if (!user) {
  setLoading(false);
  return;
}

let mounted = true;

(async () => {

  try {

    const data =
      await getActiveCommitmentByUser(
        user.id
      );

    if (!mounted) return;

    setCommitment(data);

  } finally {

    if (mounted) {
      setLoading(false);
    }

  }

})();

return () => {
  mounted = false;
};
```

}, [user]);

return {
loading,
commitment,
hasActiveCommitment:
!!commitment,
};
}
