import { Link } from "@tanstack/react-router";
import bannerImg from "@/assets/banner-stickers-chat.png";

export function StickersChatBanner() {
  return (
    <Link
      to="/comunidade"
      aria-label="Novidade: stickers no chat global"
      className="group block w-full overflow-hidden rounded-3xl shadow-soft transition-transform duration-300 hover:scale-[1.01] active:scale-[0.99]"
    >
      <img
        src={bannerImg}
        alt="Novidade: agora temos stickers no chat global"
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-auto w-full select-none object-cover"
      />
    </Link>
  );
}