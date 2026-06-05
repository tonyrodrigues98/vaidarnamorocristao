import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold text-foreground">
          My App
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-foreground font-medium" }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>
          <Link
            to="/about"
            activeProps={{ className: "text-foreground font-medium" }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sobre
          </Link>
        </nav>
      </div>
    </header>
  );
}
