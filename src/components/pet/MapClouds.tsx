import cloudsAsset from "@/assets/pet-kingdom/kingdom-clouds.png.asset.json";

/**
 * Tira de nuvens que cruza o céu do reino em loop horizontal lento.
 * Duas cópias deslocadas pra continuidade visual.
 */
export function MapClouds() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[28%] overflow-hidden opacity-90 motion-reduce:hidden"
    >
      <div className="absolute inset-y-0 left-0 flex w-[200%] animate-[cloud-drift_60s_linear_infinite]">
        <img
          src={cloudsAsset.url}
          alt=""
          draggable={false}
          className="h-full w-1/2 select-none object-contain object-bottom"
        />
        <img
          src={cloudsAsset.url}
          alt=""
          draggable={false}
          className="h-full w-1/2 select-none object-contain object-bottom"
        />
      </div>
    </div>
  );
}
