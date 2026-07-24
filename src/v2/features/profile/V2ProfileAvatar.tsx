import type { ProfileAppearance, ProfileIdentity } from "./contracts";

export function V2ProfileAvatar({
  identity,
  appearance,
}: {
  readonly identity: ProfileIdentity;
  readonly appearance: ProfileAppearance;
}) {
  const initial = identity.displayName.trim().charAt(0).toLocaleUpperCase("pt-BR") || "?";
  return (
    <div className="vdn-v2-profile-avatar">
      {appearance.auraUrl ? (
        <img
          className="vdn-v2-profile-avatar__aura"
          src={appearance.auraUrl}
          alt=""
          aria-hidden="true"
        />
      ) : null}
      <div className="vdn-v2-profile-avatar__photo">
        {identity.photoUrl ? (
          <img src={identity.photoUrl} alt={`Foto de ${identity.displayName}`} />
        ) : (
          <span aria-label={`Sem foto. Inicial ${initial}`}>{initial}</span>
        )}
      </div>
      {appearance.frameUrl ? (
        <img
          className="vdn-v2-profile-avatar__frame"
          src={appearance.frameUrl}
          alt=""
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
