import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: StructuralFoundation,
});

function StructuralFoundation() {
  return (
    <main>
      <h1>VDN</h1>
      <p>Fundação estrutural sem camada visual.</p>
    </main>
  );
}
