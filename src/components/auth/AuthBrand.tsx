import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
      <BrandLogo className="w-48 sm:w-56" />
      <div className="mt-3 flex flex-col items-center gap-0.5">
        {subtitle && (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
