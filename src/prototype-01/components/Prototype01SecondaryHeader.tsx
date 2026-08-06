import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { getNativeSecondaryDestinationChrome } from "@/config/native-secondary-destinations";

export function Prototype01SecondaryHeader({ destinationId }: { destinationId: string }) {
  const destination = getNativeSecondaryDestinationChrome(destinationId);
  if (!destination) return null;

  return (
    <header className="topbar contextual-topbar prototype01-secondary-topbar">
      <Link
        to={destination.parentPath}
        className="icon-button pressable"
        aria-label={`Voltar para ${destination.parentTab}`}
      >
        <ArrowLeft size={21} aria-hidden="true" />
      </Link>
      <div>
        <span className="section-overline">{destination.parentTab}</span>
        <h1>{destination.title}</h1>
      </div>
      <span className="prototype01-secondary-topbar__spacer" aria-hidden="true" />
    </header>
  );
}
