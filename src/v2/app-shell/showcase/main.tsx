import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { V2AppShellShowcase } from "./V2AppShellShowcase";
import "./showcase.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("App Shell showcase root was not found.");
}

createRoot(root).render(
  <StrictMode>
    <V2AppShellShowcase />
  </StrictMode>,
);
