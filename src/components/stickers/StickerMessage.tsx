export function StickerMessage({ url, alt }: { url: string; alt?: string }) {
  return (
    <img
      src={url}
      alt={alt ?? "sticker"}
      loading="lazy"
      decoding="async"
      draggable={false}
      width={48}
      height={48}
      className="mt-1 h-10 w-10 select-none object-contain animate-scale-in sm:h-12 sm:w-12"
    />
  );
}
