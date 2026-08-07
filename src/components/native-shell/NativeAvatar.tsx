import * as React from "react";

import { cn } from "@/lib/utils";

const avatarSizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
} as const;

export type NativeAvatarSize = keyof typeof avatarSizes;

type NativeAvatarImage = {
  src: string;
  alt: string;
};

type NativeAvatarFallbackOnly = {
  src?: null;
  alt?: never;
};

export type NativeAvatarProps = (NativeAvatarImage | NativeAvatarFallbackOnly) & {
  fallback: React.ReactNode;
  size?: NativeAvatarSize;
  className?: string;
};

export function NativeAvatar(props: NativeAvatarProps) {
  const { fallback, size = "md", className } = props;
  const hasImage = "src" in props && typeof props.src === "string";
  const imageSrc = hasImage ? props.src : undefined;
  const imageAlt = hasImage ? props.alt : undefined;
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  return (
    <span
      className={cn(
        "inline-grid aspect-square shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground",
        avatarSizes[size],
        className,
      )}
      data-native-avatar-size={size}
      role={hasImage && imageFailed ? "img" : undefined}
      aria-label={hasImage && imageFailed ? imageAlt : undefined}
      aria-hidden={hasImage ? undefined : true}
    >
      {hasImage && !imageFailed ? (
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full aspect-square shrink-0 rounded-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </span>
  );
}
