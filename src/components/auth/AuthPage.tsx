import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { OrhaMark } from "@/components/auth/OrhaMark";
import { cn } from "@/lib/utils";

type AuthPageProps = {
  eyebrow?: string;
  title: string;
  description: string;
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
}: AuthPageProps) {
  return (
    <main className="orha-auth-page">
      <header className="orha-auth-page__header">
        {backTo ? (
          <Link to={backTo} className="orha-auth-page__back" aria-label="Voltar">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        ) : (
          <div className="orha-auth-page__back-placeholder" aria-hidden="true" />
        )}
        <OrhaMark size="compact" />
        <div className="orha-auth-page__back-placeholder" aria-hidden="true" />
      </header>

      <section className={cn("orha-auth-card", className)} aria-labelledby="auth-title">
        {eyebrow && <p className="orha-auth-card__eyebrow">{eyebrow}</p>}
        <h1 id="auth-title" className="orha-auth-card__title">
          {title}
        </h1>
        <p className="orha-auth-card__description">{description}</p>
        {children}
      </section>
      {footer && <footer className="orha-auth-page__footer">{footer}</footer>}
    </main>
  );
}
