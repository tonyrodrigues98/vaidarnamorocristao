export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-[#fdfbf7]/82">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-8 text-sm text-muted-foreground sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-semibold text-foreground">VaiDarNamoro Cristao</p>
          <p className="mt-1 max-w-2xl">
            Prototipo visual publico, navegavel e mockado para validar a experiencia completa do
            Christian Connect.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="/suporte/ajuda" className="hover:text-foreground">
            Ajuda
          </a>
          <a href="/termos" className="hover:text-foreground">
            Termos
          </a>
          <a href="/admin" className="hover:text-foreground">
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}
