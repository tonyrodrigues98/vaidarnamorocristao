import { AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useSignedPhotoUrlResult } from "@/lib/photoUrl";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ImgProps = Omit<ComponentPropsWithoutRef<"img">, "src"> & {
  src: string | null | undefined;
  fallback?: ReactNode;
};

/** <img> wrapper that resolves stored profile-photos URLs to stable public URLs.
 *  Defaults: loading="lazy", decoding="async" — pass loading="eager" + fetchPriority="high"
 *  explicitly for the LCP image of the route. */
export function PhotoImg({
  src,
  fallback,
  className,
  onError,
  loading: loadingAttr,
  decoding,
  ...rest
}: ImgProps) {
  const { user } = useAuth();
  const { url, loading, refresh } = useSignedPhotoUrlResult(src ?? null, user?.id);

  if (!url) {
    if (fallback) return <>{fallback}</>;
    return (
      <div aria-hidden className={cn("bg-muted", loading ? "animate-pulse" : "", className)} />
    );
  }

  return (
    <img
      src={url}
      className={className}
      loading={loadingAttr ?? "lazy"}
      decoding={decoding ?? "async"}
      onError={(event) => {
        refresh();
        onError?.(event);
      }}
      {...rest}
    />
  );
}

type AvatarImageProps = Omit<ComponentPropsWithoutRef<typeof AvatarImage>, "src"> & {
  src: string | null | undefined;
};

/** AvatarImage wrapper that resolves stored profile-photos URLs to stable public URLs. */
export function PhotoAvatarImage({ src, onError, ...rest }: AvatarImageProps) {
  const { user } = useAuth();
  const { url, refresh } = useSignedPhotoUrlResult(src ?? null, user?.id);
  if (!url) return null;
  return (
    <AvatarImage
      src={url}
      onError={(event) => {
        refresh();
        onError?.(event);
      }}
      {...rest}
    />
  );
}
