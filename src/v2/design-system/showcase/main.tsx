import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { V2DesignSystemShowcase } from "./V2DesignSystemShowcase";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Design System showcase root was not found.");
}

createRoot(root).render(
  <StrictMode>
    <V2DesignSystemShowcase />
  </StrictMode>,
);
