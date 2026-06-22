import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

import { resolvePetImage } from "@/lib/petCatalog";
import { cn } from "@/lib/utils";

type PetImgProps = Omit<ComponentPropsWithoutRef<"img">, "src"> & {
  src: string | null | undefined;
};

/** Resolves private `pets` storage paths and renews expired signed URLs. */
export function PetImg({ src, className, onError, ...props }: PetImgProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(src));
  const [refreshToken, setRefreshToken] = useState(0);
  const retryCount = useRef(0);

  const refresh = useCallback(() => {
    if (src) setRefreshToken((current) => current + 1);
  }, [src]);

  useEffect(() => {
    retryCount.current = 0;
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    setLoading(Boolean(src));

    void resolvePetImage(src, refreshToken > 0).then((url) => {
      if (cancelled) return;
      setResolvedUrl(url);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshToken, src]);

  if (!resolvedUrl) {
    return (
      <span aria-hidden className={cn("block bg-muted", loading && "animate-pulse", className)} />
    );
  }

  return (
    <img
      {...props}
      src={resolvedUrl}
      className={className}
      loading={props.loading ?? "lazy"}
      decoding={props.decoding ?? "async"}
      onError={(event) => {
        if (retryCount.current < 1) {
          retryCount.current += 1;
          refresh();
        }
        onError?.(event);
      }}
    />
  );
}
