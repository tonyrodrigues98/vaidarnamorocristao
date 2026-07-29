import { useEffect, useState } from "react";

import { getNativeExploreItem, type NativeExploreItem } from "@/config/native-explore-registry";
import { getNativeExploreStorage, readNativeExploreRecent } from "@/lib/native-explore-recent";

import { NativeExploreCard } from "./NativeExploreCard";

function loadRecentItems(): NativeExploreItem[] {
  return readNativeExploreRecent(getNativeExploreStorage())
    .map((entry) => getNativeExploreItem(entry.id))
    .filter((item): item is NativeExploreItem => Boolean(item));
}

export function NativeExploreContinue() {
  const [items, setItems] = useState<NativeExploreItem[]>([]);

  useEffect(() => {
    setItems(loadRecentItems());
  }, []);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Suas experiências acessadas recentemente aparecerão aqui.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <NativeExploreCard
          key={item.id}
          item={item}
          onVisited={() => setItems(loadRecentItems())}
        />
      ))}
    </div>
  );
}
