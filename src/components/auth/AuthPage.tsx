import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthPageProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  brandWelcome?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  backTo?: "/auth/login" | "/auth/signup";
  className?: string;
};

export function AuthPage({
  eyebrow,
  title,
  description,
  children,
  footer,
  backTo,
  className,
  brandWelcome = false,
}: AuthPageProps) {
  return (
    <main className="orha-auth-page">
      <header className={cn("orha-auth-page__header", brandWelcome && "orha-auth-page__header--minimal")}>
        {backTo ? (
          <Link to={backTo} className="orha-auth-page__back" aria-label="Voltar">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        ) : (
          <div className="orha-auth-page__back-placeholder" aria-hidden="true" />
        )}
        {!brandWelcome && <div className="orha-auth-page__brand-placeholder" aria-hidden="true" />}
        <div className="orha-auth-page__back-placeholder" aria-hidden="true" />
      </header>

      <section className={cn("orha-auth-card", className)} aria-labelledby={brandWelcome ? "auth-welcome-title" : "auth-title"}>
        {brandWelcome ? <div className="orha-auth-welcome"><h1 id="auth-welcome-title" className="orha-auth-welcome__title">Você chegou à O<span aria-label="R invertido">Я</span>HA</h1><p className="orha-auth-welcome__pillars" aria-label="Conexões, Presença e Propósito"><span>Conexões</span><i aria-hidden="true" /><span>Presença</span><i aria-hidden="true" /><span>Propósito</span></p></div> : <>{eyebrow && <p className="orha-auth-card__eyebrow">{eyebrow}</p>}{title && <h1 id="auth-title" className="orha-auth-card__title">{title}</h1>}{description && <p className="orha-auth-card__description">{description}</p>}</>}
        {children}
      </section>
      {footer && <footer className="orha-auth-page__footer">{footer}</footer>}
    </main>
  );
}
