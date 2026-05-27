import { motion } from "framer-motion";

export function StickerMessage({ url, alt }: { url: string; alt?: string }) {
  return (
    <motion.img
      src={url}
      alt={alt ?? "sticker"}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      loading="lazy"
      draggable={false}
      className="mt-1 h-10 w-10 select-none object-contain sm:h-12 sm:w-12"
    />
  );
}