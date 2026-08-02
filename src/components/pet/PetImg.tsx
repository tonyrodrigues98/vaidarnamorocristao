import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

import { useAuth } from "@/lib/auth";
import { classifyPetMediaSource, resolvePetImage } from "@/lib/petCatalog";
import { cn } from "@/lib/utils";

type PetImgProps = Omit<ComponentPropsWithoutRef<"img">, "src"> & {
  src: string | null | undefined;
};

/** Resolves catalog pet art to its stable public Storage URL. */
export function PetImg({ src, className, onError, ...props }: PetImgProps) {
  const { user } = useAuth();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    () => classifyPetMediaSource(src).url,
  );
  const [loading, setLoading] = useState(Boolean(src));
  const [refreshToken, setRefreshToken] = useState(0);
  const retryCount = useRef(0);

  const refresh = useCallback(() => {
    if (src) setRefreshToken((current) => current + 1);
  }, [src]);

  useEffect(() => {
    retryCount.current = 0;
    setResolvedUrl(classifyPetMediaSource(src).url);
  }, [src]);

  useEffect(() => {
    let cancelled = false;
    setLoading(Boolean(src));

    void resolvePetImage(src, refreshToken > 0, user?.id).then((url) => {
      if (cancelled) return;
      setResolvedUrl(url);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [refreshToken, src, user?.id]);

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
