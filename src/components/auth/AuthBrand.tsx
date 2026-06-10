import { cn } from "@/lib/utils";

type AuthBrandProps = {
  subtitle?: string;
  className?: string;
};

/**
 * Branding block shown at the top of the auth screens (login, signup,
 * forgot/reset password). Reuses the real PWA icon from /icon-192.png so
 * it stays in sync with the installed app icon.
 */
export function AuthBrand({ subtitle, className }: AuthBrandProps) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <img
        src="/icon-192.png"
        alt="VaiDarNamoro Cristão"
        width={88}
        height={88}
        className="h-20 w-20 rounded-2xl shadow-lg ring-1 ring-black/5 sm:h-22 sm:w-22"
      />
      <div className="mt-4 flex flex-col items-center gap-0.5">
        <p className="text-xl font-bold tracking-tight text-foreground">
          VaiDarNamoro <span className="text-[var(--rose)]">Cristão</span>
        </p>
        {subtitle && (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}