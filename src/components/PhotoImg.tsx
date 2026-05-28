import { useSignedPhotoUrl } from "@/lib/photoUrl";
import { AvatarImage } from "@/components/ui/avatar";
import type { ComponentPropsWithoutRef } from "react";

type ImgProps = Omit<ComponentPropsWithoutRef<"img">, "src"> & {
  src: string | null | undefined;
};

/** <img> wrapper that resolves stored profile-photos URLs to signed URLs. */
export function PhotoImg({ src, ...rest }: ImgProps) {
  const resolved = useSignedPhotoUrl(src ?? null);
  if (!resolved) return null;
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img src={resolved} {...rest} />;
}

type AvatarImageProps = Omit<ComponentPropsWithoutRef<typeof AvatarImage>, "src"> & {
  src: string | null | undefined;
};

/** AvatarImage wrapper that resolves stored profile-photos URLs to signed URLs. */
export function PhotoAvatarImage({ src, ...rest }: AvatarImageProps) {
  const resolved = useSignedPhotoUrl(src ?? null);
  if (!resolved) return null;
  return <AvatarImage src={resolved} {...rest} />;
}