import { Image, PawPrint, ShieldCheck } from "lucide-react";
import { V2Heading, V2Surface, V2Text } from "@/v2/design-system";
import { profileModuleTitle, type ProfileModule } from "./contracts";

export function V2ProfileModuleCard({ module }: { readonly module: ProfileModule }) {
  const { data } = module;
  return (
    <V2Surface className={`vdn-v2-profile-module vdn-v2-profile-module--${module.type}`}>
      <V2Heading level={2} size="small">
        {profileModuleTitle(module.type)}
      </V2Heading>
      {data.text ? <V2Text>{data.text}</V2Text> : null}
      {data.gallery?.length ? (
        <ul className="vdn-v2-profile-gallery" aria-label="Galeria do perfil">
          {data.gallery.map((item) => (
            <li key={item.id}>
              <img src={item.url} alt={item.category || "Foto da galeria"} loading="lazy" />
            </li>
          ))}
        </ul>
      ) : null}
      {data.items?.length ? (
        <ul className="vdn-v2-profile-highlights">
          {data.items.map((item) => (
            <li key={item.id}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt="" aria-hidden="true" loading="lazy" />
              ) : module.type === "pet" ? (
                <PawPrint aria-hidden="true" />
              ) : (
                <ShieldCheck aria-hidden="true" />
              )}
              <span>
                <strong>{item.title}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {!data.text && !data.gallery?.length && !data.items?.length ? (
        <div className="vdn-v2-profile-module__empty">
          <Image aria-hidden="true" />
          <V2Text tone="muted">Nada foi compartilhado neste módulo.</V2Text>
        </div>
      ) : null}
    </V2Surface>
  );
}
