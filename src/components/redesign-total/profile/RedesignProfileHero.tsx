import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Camera, CircleHelp, Eye, ShieldCheck, Store, UserRoundX } from "lucide-react";

import { RedesignBadge, RedesignProgress } from "../primitives";

export function RedesignProfileHero({
  photoUrl,
  name,
  status,
  roleBadge,
  contributor,
  age,
  state,
  range,
  location,
  church,
  baptism,
  strength,
  strengthLabel,
  userId,
  petCard,
  commitment,
  onPhotoClick,
}: {
  photoUrl: string | null;
  name: ReactNode;
  status: string;
  roleBadge?: ReactNode;
  contributor: boolean;
  age: number | string | null;
  state: string | null;
  range: string;
  location: string;
  church: string;
  baptism: string;
  strength?: number;
  strengthLabel?: string;
  userId?: string;
  petCard?: ReactNode;
  commitment?: ReactNode;
  onPhotoClick(): void;
}) {
  return (
    <section className="rd-profile-hero">
      <div className="rd-profile-hero__identity">
        <button type="button" onClick={onPhotoClick} aria-label="Trocar foto de perfil">
          <span className="rd-profile-hero__avatar">
            {photoUrl ? <img src={photoUrl} alt="" /> : <span>Adicionar foto</span>}
          </span>
          <span className="rd-profile-hero__camera">
            <Camera aria-hidden />
          </span>
        </button>
        <div className="rd-profile-hero__copy">
          <div className="rd-profile-hero__badges">
            <RedesignBadge>{status}</RedesignBadge>
            {roleBadge}
            {contributor ? <RedesignBadge>Contribuidor</RedesignBadge> : null}
          </div>
          <h1>{name}</h1>
          <p>{location || "Complete sua localização no perfil."}</p>
          <div className="rd-profile-hero__actions">
            {userId ? (
              <Link to="/pretendentes/$id" params={{ id: userId }}>
                <Eye aria-hidden /> Ver público
              </Link>
            ) : null}
            <Link to="/loja">
              <Store aria-hidden /> Loja
            </Link>
          </div>
        </div>
      </div>

      <div className="rd-profile-hero__facts">
        <div>
          <strong>{age || "—"}</strong>
          <span>anos</span>
        </div>
        <div>
          <strong>{state || "—"}</strong>
          <span>estado</span>
        </div>
        <div>
          <strong>{range}</strong>
          <span>busca</span>
        </div>
      </div>

      <div className="rd-profile-hero__details">
        {typeof strength === "number" ? (
          <RedesignProgress
            value={strength}
            label="Força do perfil"
            metadata={`${strength}%${strengthLabel ? ` · ${strengthLabel}` : ""}`}
          />
        ) : null}
        <div className="rd-profile-hero__detail-grid">
          <div>
            <span>Localização</span>
            <strong>{location || "Não informada"}</strong>
          </div>
          <div>
            <span>Igreja</span>
            <strong>{church || "Não informada"}</strong>
          </div>
          <div>
            <span>Batismo</span>
            <strong>{baptism}</strong>
          </div>
        </div>
      </div>

      {petCard ? <div className="rd-profile-hero__pet">{petCard}</div> : null}
      {commitment}

      <div className="rd-profile-hero__resources">
        <Link to="/conta">
          <ShieldCheck aria-hidden />
          <span>
            <strong>Conta</strong>
            <small>Privacidade e preferências</small>
          </span>
          <ArrowRight aria-hidden />
        </Link>
        <Link to="/verificacao">
          <ShieldCheck aria-hidden />
          <span>
            <strong>Verificação</strong>
            <small>Status e documentos</small>
          </span>
          <ArrowRight aria-hidden />
        </Link>
        <Link to="/bloqueados">
          <UserRoundX aria-hidden />
          <span>
            <strong>Bloqueados</strong>
            <small>Gerencie sua segurança</small>
          </span>
          <ArrowRight aria-hidden />
        </Link>
        <Link to="/suporte">
          <CircleHelp aria-hidden />
          <span>
            <strong>Suporte</strong>
            <small>Ajuda e chamados</small>
          </span>
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
