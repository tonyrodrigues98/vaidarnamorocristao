import { cn } from "@/lib/utils";
import coinImg from "@/assets/coin.png";

export function CoinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <img
      src={coinImg}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("shrink-0 inline-block object-contain select-none", className)}
    />
  );
}
